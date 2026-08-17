'use strict';

const { Enrollment, Student, Course } = require('../models');
const { Op } = require("sequelize");
const { config, ApiError, redis } = require('@school/shared');

const CACHE_TTL = config.redis.cacheTtl;
const idKey = (id) => `enrollment:${id}`;
const LIST_TAG = 'enrollment:listEnrollments:*';

const enrollStudent = async (studentId, courseId) => {
    const [student, course] = await Promise.all([
        Student.findByPk(studentId),
        Course.findByPk(courseId),
    ]);

    if (!student) {
        throw ApiError.notFound('Student not found');
    }
    if (!course) {
        throw ApiError.notFound('Course not found');
    }
    if (course.status !== 'open') {
        throw ApiError.conflict(`Cannot enroll: course is ${course.status}`);
    }

    const existing = await Enrollment.findOne({
        where: { studentId, courseId },
    });

    if (existing) {
        throw ApiError.conflict('Student already enrolled in this course');
    }

    const enrollment = await Enrollment.create({
        studentId,
        courseId,
        status: 'active',
    });

    await redis.invalidate(LIST_TAG);
    return enrollment;
};

const getEnrollmentById = async (id, { withRelations = false } = {}) => {
    // Relation-aware lookups bypass the cache — same reasoning as
    // department/staff services: don't let a plain cached snapshot
    // silently gain/lose associations depending on who asked first.
    if (withRelations) {
        const enrollment = await Enrollment.findByPk(id, {
            include: [
                { association: 'student', attributes: ['id', 'studentCode', 'firstName', 'lastName', 'email'] },
                { association: 'course', attributes: ['id', 'code', 'title', 'level', 'status'] },
            ],
        });
        if (!enrollment) {
            throw ApiError.notFound('Enrollment not found');
        }
        return enrollment;
    }

    const cached = await redis.get(idKey(id));
    if (cached) return cached;

    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) {
        throw ApiError.notFound('Enrollment not found');
    }

    await redis.set(idKey(id), enrollment, CACHE_TTL);
    return enrollment;
};

const listEnrollments = async (query) => {
    // query should already be validated via listQuerySchema
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.courseId) where.courseId = query.courseId;
    if (query.status) where.status = query.status;

    const { rows, count } = await Enrollment.findAndCountAll({
        where,
        limit,
        offset,
        order: [["id", "ASC"]],
    });

    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

const updateEnrollment = async (id, data) => {
    // data should already be validated via updateSchema
    const enrollment = await getEnrollmentById(id);

    const updated = await enrollment.update(data);
    await redis.del(idKey(id));
    await redis.invalidate(LIST_TAG);
    return updated;
};

const deleteEnrollment = async (id) => {
    const enrollment = await getEnrollmentById(id);
    await enrollment.destroy();
    await redis.del(idKey(id));
    await redis.invalidate(LIST_TAG);
    return enrollment;
};

module.exports = {
    enrollStudent,
    getEnrollmentById,
    listEnrollments,
    updateEnrollment,
    deleteEnrollment,
};