'use strict';

const { Router } = require('express');
const { validate, authenticate, authorize, rateLimiter } = require('@school/shared');
const ctrl = require('../controllers/department.controller');
const { createSchema, updateSchema, listQuerySchema } = require('../validators/department.validator');

const router = Router();
router.use(authenticate, rateLimiter());

router.get('/', validate(listQuerySchema, 'query'), ctrl.listDepartments);
router.get('/:id', ctrl.getDepartmentById);
router.post('/', authorize('admin', 'staff'), validate(createSchema), ctrl.createDepartment);
router.put('/:id', authorize('admin', 'staff'), validate(updateSchema), ctrl.updateDepartment);
router.delete('/:id', authorize('admin'), ctrl.deleteDepartment);

module.exports = router;