// el project routes — CRUD + AI estimate + publish + close
const express = require('express');
const ctrl = require('../controllers/project.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// public — list + detail
router.get('/', ctrl.listProjects);
router.get('/:id', ctrl.getProject);

// customer only — create (query ?draft=1 → مسودة)
router.post('/', requireAuth, requireRole('customer'), ctrl.createProject);

// customer only — update project (draft أو open بدون عروض)
router.patch('/:id', requireAuth, requireRole('customer'), ctrl.updateProject);

// customer only — delete project (draft أو open بدون عروض)
router.delete('/:id', requireAuth, requireRole('customer'), ctrl.deleteProject);

// customer only — publish draft → open
router.post('/:id/publish', requireAuth, requireRole('customer'), ctrl.publishDraft);

// customer only — close project (awarded → closed) + تقييم المقاول
router.post('/:id/close', requireAuth, requireRole('customer'), ctrl.closeProject);

// customer only — AI price estimate (preview via body)
router.post('/ai-estimate', requireAuth, requireRole('customer'), ctrl.aiEstimate);

// customer only — AI price estimate (project owner)
router.post('/:id/ai-estimate', requireAuth, requireRole('customer'), ctrl.aiEstimate);

module.exports = router;
