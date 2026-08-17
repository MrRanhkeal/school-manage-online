`use strict`

const { Op } = require('sequelize');
const { config, ApiError, redis } = require('@school/shared');
const { Student, SchoolClass, Teacher } = require('../models');
const authClient = require('../clients/auth.client');
const paymentClient = require('../clients/payment.client');
const notificationClient = require('../clients/notification.client');

const CACHE_TTL = config.redis.cacheTtl;
const idKey = (id) => `student:${id}`;
const LIST_TAG = 'student:list:*';

/**
 * Ensure the student has an auth_db user and return its id.
 * Find-or-create by email in auth-service (application-level FK binding).
 */
async function resolveAuthUser({ email, firstName, lastName, password }) {
    if (!email) return null;
    return authClient.resolveUser({
        email,
        fullName: `${firstName} ${lastName}`.trim(),
        role: 'student',
        password
    });
}

/** Application-level join: attach auth_db user info to student rows. */
async function withUsers(students) {
    const users = await authClient.getUsersByIds(students.map((s) => s.userId));
    for (const s of students) s.user = s.userId ? users[s.userId] || null : null;
    return students;
}

/** Single student read goes through Redis (cache-aside). */
async function getById(id) {
    const student = await redis.cacheWrap(idKey(id), CACHE_TTL, async () => {
        const row = await Student.findByPk(id, {
            include: [
                {
                    model: SchoolClass,
                    as: 'class',
                    include: [
                        {
                            model: Teacher,
                            as: 'Teacher',
                            attributes: ['id', 'teacherCode', 'firstName', 'lastName'],
                        },
                    ],
                },
            ],
        });
        return row ? row.toJSON() : null;
    });
    if (!student) throw ApiError.notFound('Student not found');
    await withUsers([student]);
    // Application-level join (Student.hasMany(Payment, { as: 'payments' })
    // equivalent): attach the student's payment_db payments. Joined outside
    // the cache so payment status is always fresh.
    const payments = await paymentClient.getPaymentsByStudentIds([student.id]);
    student.payments = payments[student.id] || [];
    return student;
}

/**
 * Paginated, filterable listing. Cached per filter-combination so identical
 * dashboard queries don't re-hit MySQL within the TTL window.
 */
async function list(query) {
    const { page = 1, limit = 20, level, classId, enrollmentYear, status, search } = query;
    const offset = (page - 1) * limit;

    const where = {};
    if (level) where.level = level;
    if (classId) where.classId = classId;
    if (enrollmentYear) where.enrollmentYear = enrollmentYear;
    if (status) where.status = status;
    if (search) {
        where[Op.or] = [
            { firstName: { [Op.like]: `%${search}%` } },
            { lastName: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { guardianName: { [Op.like]: `%${search}%` } },
            { studentCode: { [Op.like]: `%${search}%` } },
        ];
    }

    const cacheKey = `student:list:${JSON.stringify({ where, page, limit })}`;
    const result = await redis.cacheWrap(cacheKey, 60, async () => {
        const { rows, count } = await Student.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: SchoolClass,
                    as: 'class',
                    attributes: ['id', 'name', 'academicYear'],
                },
            ],
            order: [['lastName', 'ASC'], ['firstName', 'ASC']],
        });
        return {
            items: rows.map((r) => r.toJSON()),
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit) || 1,
        };
    });
    await withUsers(result.items);
    return result;
}

/** classId must point to a real class before we bind the student to it. */
async function assertClassExists(classId) {
    if (classId == null) return;
    const exists = await SchoolClass.count({ where: { id: classId } });
    if (!exists) throw ApiError.notFound(`Class ${classId} not found`);
}

async function create(data) {
    const lastStudent = await Student.findOne({
        where: {
            studentCode: {
                [Op.like]: 'ST-%',
            },
        },
        order: [['studentCode', 'DESC']],
        attributes: ['studentCode'],
    });

    let nextNumber = 1;

    if (lastStudent?.studentCode) {
        const currentNumber = Number(
            lastStudent.studentCode.replace('ST-', '')
        );

        nextNumber = currentNumber + 1;
    }

    const studentCode = `ST-${String(nextNumber).padStart(4, '0')}`;

    await assertClassExists(data.classId);

    let authUser = null;
    if (!data.userId && data.email) {
        authUser = await resolveAuthUser(data);

        if (authUser?.id) {
            data.userId = authUser.id;
        }
    }

    delete data.password;
    const student = await Student.create({
        ...data,
        studentCode,
    });

    await redis.invalidate(LIST_TAG);
    const json = student.toJSON();

    if (authUser) {
        json.user = authUser;
    }
    notificationClient.notify({
        type: 'student-enrolled',
        studentId: Number(student.id),
        to: student.email || undefined,
        data: {
            fullName: `${student.firstName} ${student.lastName}`.trim(),
            studentCode: student.studentCode,
            level: student.level,
        },
    });

    return json;
}


async function update(id, data) {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound('Student not found');
    await assertClassExists(data.classId);

    // Backfill the auth_db link for rows created before the binding existed.
    let authUser = null;
    if (!data.userId && !student.userId) {
        authUser = await resolveAuthUser({
            email: data.email || student.email,
            firstName: data.firstName || student.firstName,
            lastName: data.lastName || student.lastName,
            password: data.password,
        });
        if (authUser) data.userId = authUser.id;
    }

    delete data.password;

    await student.update(data);
    await Promise.all([redis.invalidate(idKey(id)), redis.invalidate(LIST_TAG)]);
    const json = student.toJSON();
    if (authUser) json.user = authUser;
    return json;
}

async function remove(id) {
    const student = await Student.findByPk(id);
    if (!student) throw ApiError.notFound('Student not found'); 
    await paymentClient.assertNoPayments(id);
    await student.destroy();
    await Promise.all([redis.invalidate(idKey(id)), redis.invalidate(LIST_TAG)]);
}

module.exports = { getById, list, create, update, remove };
