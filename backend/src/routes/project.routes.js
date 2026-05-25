// el project routes — CRUD + AI estimate + publish + close + media upload
const express = require('express');
const ctrl = require('../controllers/project.controller');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { uploadProjectMedia, uploadClosurePhotos } = require('../middleware/upload');

const router = express.Router();

// public — list + detail
router.get('/', optionalAuth, ctrl.listProjects);
router.get('/:id', optionalAuth, ctrl.getProject);

// customer only — create (query ?draft=1 → مسودة)
router.post('/', requireAuth, requireRole('customer'), ctrl.createProject);

// customer only — update project (draft أو open بدون عروض)
router.patch('/:id', requireAuth, requireRole('customer'), ctrl.updateProject);

// customer only — delete project (draft أو open بدون عروض)
router.delete('/:id', requireAuth, requireRole('customer'), ctrl.deleteProject);

// customer only — publish draft → open
router.post('/:id/publish', requireAuth, requireRole('customer'), ctrl.publishDraft);

// customer only — close project (awarded → closed) + تقييم المقاول + صور إلزامية
router.post('/:id/close',
  requireAuth,
  requireRole('customer'),
  uploadClosurePhotos.fields([
    { name: 'closureBefore', maxCount: 10 },
    { name: 'closureAfter', maxCount: 10 },
  ]),
  ctrl.closeProject
);

// customer only — upload project media (up to 20 images)
router.post('/:id/media',
  requireAuth,
  requireRole('customer'),
  uploadProjectMedia.array('images', 20),
  ctrl.uploadProjectMedia
);

// customer only — AI price estimate (preview via body)
router.post('/ai-estimate', requireAuth, requireRole('customer'), ctrl.aiEstimate);

// customer only — AI price estimate (project owner)
router.post('/:id/ai-estimate', requireAuth, requireRole('customer'), ctrl.aiEstimate);

// customer only — invite contractor to private project
router.post('/:id/invite', requireAuth, requireRole('customer'), ctrl.inviteContractor);

// admin only — set isFeatured / isUrgent flags
router.put('/:id/feature', requireAuth, requireRole('admin', 'super_admin'), ctrl.featureProject);

module.exports = router;
