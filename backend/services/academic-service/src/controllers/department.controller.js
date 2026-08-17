`use strict`

const { asyncHandler, ok, ApiError } = require('@school/shared');
const service = require('../service/department.service');
const logErr = require('@school/shared/middleware/logErr');

exports.listDepartments = asyncHandler(async (req, res) => {
    try {
        const { items, ...meta } = await service.listDepartments(req.query);
        ok(res, items, meta);
    }
    catch (err) {
        logErr('academic.department.list', res, res);
    }
})
exports.createDepartment = asyncHandler(async (req, res) => {
    try {
        ok(res, await service.createDepartment(req.body), undefined, 201);
    }
    catch (err) {
        logErr('academic.department.create', res, res);
        throw ApiError;
    }
})
exports.updateDepartment = asyncHandler(async (req, res) => {
    try {
        ok(res, await service.updateDepartment(req.params.id, req.body), undefined, 201);
    }
    catch (err) {
        logErr('academic.department.update', res, res);
        throw ApiError;
    }
})
exports.deleteDepartment = asyncHandler(async (req, res) => {
    try {
        await service.deleteDepartment(req.params.id);
        ok(res, { message: 'Departments deleted' });
    }
    catch (err) {
        logErr('academic.department.remove', res, res);
        throw ApiError;
    }
})
exports.getDepartmentById = asyncHandler(async (req, res) => {
    try {
        ok(res, await service.getDepartmentById(req.params.id));
    }
    catch (err) {
        logErr('academic.department.getdepartmentId', res, res);
    }
})