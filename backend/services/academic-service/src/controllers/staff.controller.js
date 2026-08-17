`use strict`

const { asyncHandler, ok, ApiError } = require('@school/shared');
const service = require('../service/staff.service');
const logErr = require('@school/shared/middleware/logErr');

exports.listStaffs = asyncHandler(async (req, res) => {
    try {
        const { items, ...meta } = await service.listStaffs(req.query);
        ok(res, items, meta);
    }
    catch (err) {
        logErr('academic.staff.list', res, res);
    }
})
exports.createStaff = asyncHandler(async (req, res) => {
    try {
        ok(res, await service.createStaff(req.body), undefined, 201);
    }
    catch (err) {
        logErr('academic.staff.create', res, res);
        throw ApiError;
    }
})
exports.updateStaff = asyncHandler(async (req, res) => {
    try {
        ok(res, await service.updateStaff(req.params.id, req.body), undefined, 201);
    }
    catch (err) {
        logErr('academic.staff.update', res, res);
        throw ApiError;
    }
})
exports.deleteStaff = asyncHandler(async (req, res) => {
    try {
        await service.deleteStaff(req.params.id);
        ok(res, { message: 'Staff deleted' });
    }
    catch (err) {
        logErr('academic.staf.delete', res, res);
        throw ApiError;
    }
})
exports.getStaffById = asyncHandler(async (req, res) => {
    try {
        ok(res, await service.getStaffById(req.params.id));
    }
    catch (err) {
        logErr('academic.staff.ById', res, res);
    }
})