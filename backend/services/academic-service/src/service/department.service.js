'use strict';

const { Op } = require("sequelize");
const { Department, Course, sequelize } = require("../models");
const { config, ApiError, redis } = require('@school/shared');

// Correlated subqueries for the list view — cheaper than pulling full
// teacher/staff/course rows just to show counts, and keeps findAndCountAll's
// separate COUNT(*) query (for pagination) unaffected since these are plain
// scalar columns, not an include/association.
const relationCountAttributes = [
    [
        sequelize.literal(
            '(SELECT COUNT(*) FROM teachers WHERE teachers.department_id = `Department`.`id`)'
        ),
        'teacherCount',
    ],
    [
        sequelize.literal(
            '(SELECT COUNT(*) FROM staffs WHERE staffs.department_id = `Department`.`id`)'
        ),
        'staffCount',
    ],
    [
        sequelize.literal(
            '(SELECT COUNT(*) FROM courses WHERE courses.department_id = `Department`.`id`)'
        ),
        'courseCount',
    ],
];

const CACHE_TTL = config.redis.cacheTtl;
const idKey = (id) => `department:${id}`;
const LIST_TAG = 'department:listDepartments:*';

const createDepartment = async (data) => {
    // data should already be validated via createSchema
    const existing = await Department.findOne({ where: { code: data.code } });
    if (existing) {
        throw ApiError.conflict('Department code already exists');
    }

    try {
        const department = await Department.create(data);
        await redis.invalidate(LIST_TAG);
        return department;
    } catch (err) {
        // code has a unique index at the DB level (department.model.js) — the
        // findOne check above is best-effort and can lose a race under
        // concurrent creates with the same code.
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw ApiError.conflict('Department code already exists');
        }
        throw err;
    }
};

const getDepartmentById = async (id, { withRelations = false } = {}) => {
    // Relation-aware lookups bypass the cache — the cached payload is a
    // plain snapshot and shouldn't silently grow associations depending on
    // who asked for it first.
    if (withRelations) {
        const department = await Department.findByPk(id, {
            include: [
                { association: 'teachers', attributes: ['id', 'firstName', 'lastName', 'email', 'status'] },
                { association: 'staffMembers', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { association: 'courses', attributes: ['id', 'code', 'title', 'level', 'status'] },
            ],
        });
        if (!department) {
            throw ApiError.notFound('Department not found');
        }
        return department;
    }

    const cached = await redis.get(idKey(id));
    if (cached) return cached;

    const department = await Department.findByPk(id);
    if (!department) {
        throw ApiError.notFound('Department not found');
    }

    await redis.set(idKey(id), department, CACHE_TTL);
    return department;
};

const listDepartments = async (query) => {
    // query should already be validated via listQuerySchema
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (query.search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${query.search}%` } },
            { code: { [Op.like]: `%${query.search}%` } },
            { locations: { [Op.like]: `%${query.search}%` } },
        ];
    }

    const { rows, count } = await Department.findAndCountAll({
        where,
        limit,
        offset,
        order: [["id", "ASC"]],
        attributes: {
            include: relationCountAttributes,
        },
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

const updateDepartment = async (id, data) => {
    // data should already be validated via updateSchema
    const department = await getDepartmentById(id);

    if (data.code && data.code !== department.code) {
        const existing = await Department.findOne({ where: { code: data.code } });
        if (existing) {
            throw ApiError.conflict('Department code already exists');
        }
    }

    try {
        const updated = await department.update(data);
        await redis.del(idKey(id));
        await redis.invalidate(LIST_TAG);
        return updated;
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw ApiError.conflict('Department code already exists');
        }
        throw err;
    }
};

const deleteDepartment = async (id) => {
    const department = await getDepartmentById(id);

    // Teachers/staff on this department are FK SET NULL, but courses cascade
    // (see models/index.js) — surface that up front instead of letting the
    // DB silently wipe them out.
    const courseCount = await Course.count({ where: { departmentId: id } });
    if (courseCount > 0) {
        throw ApiError.conflict(
            `Cannot delete department: ${courseCount} course(s) still reference it`
        );
    }

    await department.destroy();
    await redis.del(idKey(id));
    await redis.invalidate(LIST_TAG);
    return department;
};

module.exports = { createDepartment, getDepartmentById, listDepartments, updateDepartment, deleteDepartment };