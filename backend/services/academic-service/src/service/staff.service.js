'use strict';

const { Op } = require("sequelize");
const { Staff, Department } = require("../models");
const { config, ApiError, redis } = require('@school/shared');

const CACHE_TTL = config.redis.cacheTtl;
const idKey = (id) => `staff:${id}`;
const LIST_TAG = 'staff:listStaffs:*';

const assertDepartmentExists = async (departmentId) => {
    if (departmentId == null) return;
    const department = await Department.findByPk(departmentId);
    if (!department) {
        throw ApiError.notFound('Department not found');
    }
};

const createStaff = async (data) => {
    // data should already be validated via createSchema
    const existing = await Staff.findOne({ where: { email: data.email } });
    if (existing) {
        throw ApiError.conflict('Email already in use');
    }

    await assertDepartmentExists(data.departmentId);

    const staff = await Staff.create(data);
    await redis.invalidate(LIST_TAG);
    return staff;
};

const getStaffById = async (id, { withDepartment = false } = {}) => {
    // Relation-aware lookups bypass the cache — same reasoning as
    // department.service: don't let a plain cached snapshot silently
    // gain/lose an association depending on who asked first.
    if (withDepartment) {
        const staff = await Staff.findByPk(id, {
            include: [
                { association: 'department', attributes: ['id', 'code', 'name', 'locations'] },
            ],
        });
        if (!staff) {
            throw ApiError.notFound('Staff not found');
        }
        return staff;
    }

    const cached = await redis.get(idKey(id));
    if (cached) return cached;

    const staff = await Staff.findByPk(id);
    if (!staff) {
        throw ApiError.notFound('Staff not found');
    }

    await redis.set(idKey(id), staff, CACHE_TTL);
    return staff;
};

const listStaffs = async (query) => {
    // query should already be validated via listQuerySchema
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.search) {
        where[Op.or] = [
            { firstName: { [Op.like]: `%${query.search}%` } },
            { lastName: { [Op.like]: `%${query.search}%` } },
            { email: { [Op.like]: `%${query.search}%` } },
        ];
    }

    const { rows, count } = await Staff.findAndCountAll({
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

const updateStaff = async (id, data) => {
    // data should already be validated via updateSchema
    const staff = await getStaffById(id);

    if (data.email && data.email !== staff.email) {
        const existing = await Staff.findOne({ where: { email: data.email } });
        if (existing) {
            throw ApiError.conflict('Email already in use');
        }
    }

    if (data.departmentId !== undefined && data.departmentId !== staff.departmentId) {
        await assertDepartmentExists(data.departmentId);
    }

    const updated = await staff.update(data);
    await redis.del(idKey(id));
    await redis.invalidate(LIST_TAG);
    return updated;
};

const deleteStaff = async (id) => {
    const staff = await getStaffById(id);
    await staff.destroy();
    await redis.del(idKey(id));
    await redis.invalidate(LIST_TAG);
    return staff;
};

module.exports = {
    createStaff,
    getStaffById,
    listStaffs,
    updateStaff,
    deleteStaff,
};