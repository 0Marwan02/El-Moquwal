// AI Agent routes — تنظيم وصف مشروع + مسودة عرض
const express = require('express');
const ctrl = require('../controllers/ai.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// AI-AGENT-BRIEF-01 — تنظيم وصف مشروع (عميل فقط)
router.post('/project-brief', requireAuth, requireRole('customer'), ctrl.projectBrief);

// AI-AGENT-BID-DRAFT-01 — مسودة عرض (مقاول فقط)
router.post('/bid-draft', requireAuth, requireRole('contractor'), ctrl.bidDraft);

module.exports = router;
