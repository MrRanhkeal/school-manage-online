`use strict`

const { asyncHandler, ok, ApiError } = require('@school/shared');
const service = require('../service/enrollment.service');
const logErr = require('@school/shared/middleware/logErr');

exports.listEnrollments = asyncHandler(async (req, res) => {
    try {
        const { items, ...meta } = await service.listEnrollments(req.query);
        ok(res, items, meta);
    }
    catch (err) {
        logErr('academic.enroll.list', res, res);
    }
})
exports.enrollStudent = asyncHandler(async (req, res) => {
    try {
        ok(res, await service.enrollStudent(req.body), undefined, 201);
    }
    catch (err) {
        logErr('academic.enroll.enrollStudent', res, res);
        throw ApiError;
    }
})
exports.updateEnrollment = asyncHandler(async (req, res) => {
    try {
        ok(res, await service.updateEnrollment(req.params.id, req.body), undefined, 201);
    }
    catch (err) {
        logErr('academic.enroll.update', res, res);
        throw ApiError;
    }
})
exports.deleteEnrollment = asyncHandler(async (req, res) => {
    try {
        await service.deleteEnrollment(req.params.id);
        ok(res, { message: 'Enrollment deleted' });
    }
    catch (err) {
        logErr('academic.department.remove', res, res);
        throw ApiError;
    }
})
exports.getEnrollmentById = asyncHandler(async (req, res) => {
    try {
        ok(res, await service.getEnrollmentById(req.params.id));
    }
    catch (err) {
        logErr('academic.enrollById', res, res);
    }
})