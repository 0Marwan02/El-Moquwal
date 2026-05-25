// Admin routes — review contractors, manage settings, super_admin ops
const express = require('express');
const ctrl = require('../controllers/admin.controller');
const { requireAuth, requireRole, requireSuperAdmin, requirePermission } = require('../middleware/auth');

const router = express.Router();

// ===== Admin (reviewer) routes =====
// VIEW routes — any authenticated admin (or super_admin) can read
router.get('/contractors/pending', requireAuth, requireRole('admin'), ctrl.listPending);
router.get('/projects',            requireAuth, requireRole('admin'), ctrl.listAllProjects);
router.get('/stats',               requireAuth, requireRole('admin'), ctrl.dashboardStats);
router.get('/disputes',            requireAuth, requireRole('admin'), ctrl.listDisputes);

// ACTION routes — super_admin always passes; regular admin needs the matching permission
router.post('/contractors/:id/approve', requireAuth, requireRole('admin'), requirePermission('review_contractors'), ctrl.approveContractor);
router.post('/contractors/:id/reject',  requireAuth, requireRole('admin'), requirePermission('review_contractors'), ctrl.rejectContractor);

// ===== Platform settings (admin can view, super_admin can edit) =====
router.get('/settings', requireAuth, requireRole('admin'), ctrl.getSettings);
router.patch('/settings', requireAuth, requireSuperAdmin, ctrl.updateSettings);

// ===== Super Admin only — manage reviewer admins =====
router.post('/create-reviewer', requireAuth, requireSuperAdmin, ctrl.createReviewer);
router.get('/reviewers', requireAuth, requireSuperAdmin, ctrl.listReviewers);
router.delete('/reviewers/:id', requireAuth, requireSuperAdmin, ctrl.deleteReviewer);
router.patch('/reviewers/:id/permissions', requireAuth, requireSuperAdmin, ctrl.updateReviewerPermissions);

// list of valid permission keys — used by the frontend to render checkboxes dynamically
router.get('/permissions', requireAuth, requireSuperAdmin, ctrl.listAvailablePermissions);

// ===== Terms & Conditions =====
router.get('/terms', ctrl.getTerms); // public
router.patch('/terms', requireAuth, requireSuperAdmin, ctrl.updateTerms);

module.exports = router;
