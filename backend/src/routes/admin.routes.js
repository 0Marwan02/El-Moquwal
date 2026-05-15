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

// admin projects — كل المشاريع بفلترة
router.get('/projects', ctrl.listAllProjects);

// admin stats — إحصائيات سريعة
router.get('/stats', ctrl.dashboardStats);

module.exports = router;
