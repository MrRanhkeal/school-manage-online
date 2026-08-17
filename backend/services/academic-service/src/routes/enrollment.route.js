'use strict';

const { Router } = require('express');
const { validate, authenticate, authorize, rateLimiter } = require('@school/shared');
const ctrl = require('../controllers/enrollment.controller');
const { createSchema, updateSchema, listQuerySchema } = require('../validators/enrollment.validator');

const router = Router();
router.use(authenticate, rateLimiter());

router.get('/', validate(listQuerySchema, 'query'), ctrl.listEnrollments);
router.get('/:id', ctrl.getEnrollmentById);
router.post('/', authorize('admin', 'staff'), validate(createSchema), ctrl.enrollStudent);
router.put('/:id', authorize('admin', 'staff'), validate(updateSchema), ctrl.updateEnrollment);
router.delete('/:id', authorize('admin'), ctrl.deleteEnrollment);

module.exports = router;