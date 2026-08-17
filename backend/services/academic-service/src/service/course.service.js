'use strict';

const { Op } = require('sequelize');
const { config, ApiError, redis } = require('@school/shared');
const { Course, Teacher, SchoolClass, Department } = require('../models');

const courseIncludes = [
    {
        model: Teacher,
        as: 'teacher',
        attributes: ['id', 'teacherCode', 'firstName', 'lastName', 'department'],
    },
    {
        model: SchoolClass,
        as: 'class',
        attributes: ['id', 'name', 'level', 'academicYear'],
    },
    {
        model: Department,
        as: 'department',
        attributes: ['id', 'code', 'name'],
    },
];

const CACHE_TTL = config.redis.cacheTtl;
const idKey = (id) => `course:${id}`;
const LIST_TAG = 'course:list:*';

// Keep these in sync with the ENUMs defined on Course (course.model.js)
const LEVELS = ['primary', 'secondary', 'high_school', 'college'];
const STATUSES = ['open', 'closed', 'archived'];

function assertValidEnum(value, allowed, field) {
    if (value != null && !allowed.includes(value)) {
        throw ApiError.badRequest(
            `Invalid ${field} "${value}". Expected one of: ${allowed.join(', ')}`
        );
    }
}

async function getById(id) {
    const row = await redis.cacheWrap(idKey(id), CACHE_TTL, async () => {
        const r = await Course.findByPk(id, { include: courseIncludes });
        return r ? r.toJSON() : null;
    });
    if (!row) throw ApiError.notFound('Course not found');
    return row;
}

async function create(data) {
    assertValidEnum(data.level, LEVELS, 'level');
    assertValidEnum(data.status, STATUSES, 'status');

    // Find the latest course code (code is unique per the model's index)
    const lastCourse = await Course.findOne({
        where: {
            code: {
                [Op.like]: 'C-%',
            },
        },
        order: [['code', 'DESC']],
        attributes: ['code'],
    });

    let nextNumber = 1;

    if (lastCourse?.code) {
        const currentNumber = Number(lastCourse.code.replace('C-', ''));

        if (!Number.isNaN(currentNumber)) {
            nextNumber = currentNumber + 1;
        }
    }

    const code = `C-${String(nextNumber).padStart(4, '0')}`;

    await assertRelationsExist(data);

    const c = await Course.create({
        ...data,
        code,
    });

    await redis.invalidate(LIST_TAG);

    return c.toJSON();
}

async function list(query) {
    const {
        page = 1,
        limit = 20,
        level,
        teacherId,
        classId,
        departmentId,
        academicYear,
        status,
        search,
    } = query;

    assertValidEnum(level, LEVELS, 'level');
    assertValidEnum(status, STATUSES, 'status');

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);

    const where = {};

    if (level) where.level = level;
    if (teacherId) where.teacherId = teacherId;
    if (classId) where.classId = classId;
    if (departmentId) where.departmentId = departmentId;
    if (academicYear) where.academicYear = academicYear;
    if (status) where.status = status;

    if (search) {
        where[Op.or] = [
            {
                title: {
                    [Op.like]: `%${search}%`,
                },
            },
            {
                code: {
                    [Op.like]: `%${search}%`,
                },
            },
        ];
    }

    const cacheKey = `course:list:${JSON.stringify({
        where,
        page: pageNum,
        limit: limitNum,
    })}`;

    return redis.cacheWrap(cacheKey, 60, async () => {
        const { rows, count } = await Course.findAndCountAll({
            where,
            limit: limitNum,
            offset: (pageNum - 1) * limitNum,
            include: courseIncludes,

            // C-0001, C-0002, C-0003...
            order: [['code', 'ASC']],
        });

        return {
            items: rows.map((r) => r.toJSON()),
            total: count,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum) || 1,
        };
    });
}

/** teacherId / classId / departmentId must point to real rows before we bind them. */
async function assertRelationsExist({ teacherId, classId, departmentId }) {
    if (teacherId != null) {
        const found = await Teacher.count({ where: { id: teacherId } });
        if (!found) {
            throw ApiError.notFound(`Teacher ${teacherId} not found`);
        }
    }

    if (classId != null) {
        const found = await SchoolClass.count({ where: { id: classId } });
        if (!found) {
            throw ApiError.notFound(`Class ${classId} not found`);
        }
    }

    if (departmentId != null) {
        const found = await Department.count({ where: { id: departmentId } });
        if (!found) {
            throw ApiError.notFound(`Department ${departmentId} not found`);
        }
    }
}

async function update(id, data) {
    assertValidEnum(data.level, LEVELS, 'level');
    assertValidEnum(data.status, STATUSES, 'status');

    const c = await Course.findByPk(id);
    if (!c) throw ApiError.notFound('Course not found');
    await assertRelationsExist(data);
    await c.update(data);
    await Promise.all([redis.invalidate(idKey(id)), redis.invalidate(LIST_TAG)]);
    return c.toJSON();
}

async function remove(id) {
    const c = await Course.findByPk(id);
    if (!c) throw ApiError.notFound('Course not found');
    await c.destroy();
    await Promise.all([redis.invalidate(idKey(id)), redis.invalidate(LIST_TAG)]);
}

module.exports = { getById, list, create, update, remove };