// el admin routes — kolha bte7tag requireAuth + requireRole('admin')
const express = require('express');
const ctrl = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// kol 7aga ta7t dy lazem admin
router.use(requireAuth, requireRole('admin'));

router.get('/contractors/pending', ctrl.listPending);
router.post('/contractors/:id/approve', ctrl.approveContractor);
router.post('/contractors/:id/reject', ctrl.rejectContractor);

module.exports = router;
