// Admin routes — review contractors, manage settings, super_admin ops
const express = require('express');
const ctrl = require('../controllers/admin.controller');
const { requireAuth, requireRole, requireSuperAdmin, requirePermission } = require('../middleware/auth');

const router = express.Router();

// ===== Admin (reviewer) routes =====
// VIEW routes — super_admin always passes; regular admin needs the matching permission
router.get('/contractors/pending', requireAuth, requireRole('admin'), requirePermission('review_contractors'), ctrl.listPending);
router.get('/contractors/pending/count', requireAuth, requireRole('admin'), requirePermission('review_contractors'), ctrl.pendingCount);
router.get('/projects',            requireAuth, requireRole('admin'), requirePermission('view_projects'), ctrl.listAllProjects);
router.get('/stats',               requireAuth, requireRole('admin'), requirePermission('view_stats'), ctrl.dashboardStats);
router.get('/disputes',            requireAuth, requireRole('admin'), requirePermission('manage_disputes'), ctrl.listDisputes);

// ACTION routes — super_admin always passes; regular admin needs the matching permission
router.post('/contractors/:id/approve', requireAuth, requireRole('admin'), requirePermission('review_contractors'), ctrl.approveContractor);
router.post('/contractors/:id/reject',  requireAuth, requireRole('admin'), requirePermission('review_contractors'), ctrl.rejectContractor);

// ===== Platform settings (super_admin only — تكشف اقتصاديات المنصة) =====
router.get('/settings', requireAuth, requireSuperAdmin, ctrl.getSettings);
router.patch('/settings', requireAuth, requireSuperAdmin, ctrl.updateSettings);

// ===== Super Admin only — manage reviewer admins =====
router.post('/create-reviewer', requireAuth, requireSuperAdmin, ctrl.createReviewer);
router.get('/reviewers', requireAuth, requireSuperAdmin, ctrl.listReviewers);
router.delete('/reviewers/:id', requireAuth, requireSuperAdmin, ctrl.deleteReviewer);
router.patch('/reviewers/:id/permissions', requireAuth, requireSuperAdmin, ctrl.updateReviewerPermissions);

// list of valid permission keys — used by the frontend to render checkboxes dynamically
router.get('/permissions', requireAuth, requireSuperAdmin, ctrl.listAvailablePermissions);

// audit log — سجل عمليات الإدارة
router.get('/audit-log', requireAuth, requireSuperAdmin, ctrl.listAuditLog);

// ===== Terms & Conditions =====
router.get('/terms', ctrl.getTerms); // public
router.patch('/terms', requireAuth, requireSuperAdmin, ctrl.updateTerms);

module.exports = router;
