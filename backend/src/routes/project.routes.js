// el project routes — CRUD + AI estimate
const express = require('express');
const ctrl = require('../controllers/project.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// public — list + detail
router.get('/', ctrl.listProjects);
router.get('/:id', ctrl.getProject);

// customer only — create
router.post('/', requireAuth, requireRole('customer'), ctrl.createProject);

// customer only — AI price estimate (preview via body)
router.post('/ai-estimate', requireAuth, requireRole('customer'), ctrl.aiEstimate);

// customer only — AI price estimate (project owner)
router.post('/:id/ai-estimate', requireAuth, requireRole('customer'), ctrl.aiEstimate);

module.exports = router;
