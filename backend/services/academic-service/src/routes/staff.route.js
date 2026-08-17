'use strict';

const { Router } = require('express');
const { validate, authenticate, authorize, rateLimiter } = require('@school/shared');
const ctrl = require('../controllers/staff.controller');
const { createSchema, updateSchema, listQuerySchema } = require('../validators/staff.validator');

const router = Router();
router.use(authenticate, rateLimiter());

router.get('/', validate(listQuerySchema, 'query'), ctrl.listStaffs);
router.get('/:id', ctrl.getStaffById);
router.post('/', authorize('admin', 'staff'), validate(createSchema), ctrl.createStaff);
router.put('/:id', authorize('admin', 'staff'), validate(updateSchema), ctrl.updateStaff);
router.delete('/:id', authorize('admin'), ctrl.deleteStaff);

module.exports = router;