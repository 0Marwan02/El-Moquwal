// AI Agent routes — تنظيم وصف مشروع + مسودة عرض + مقارنة + شذوذ + شات بوت + بوت السياسات
const express = require('express');
const ctrl = require('../controllers/ai.controller');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { policyLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// AI-AGENT-BRIEF-01 — تنظيم وصف مشروع (عميل فقط)
router.post('/project-brief', requireAuth, requireRole('customer'), ctrl.projectBrief);

// AI-AGENT-BID-DRAFT-01 — مسودة عرض (مقاول فقط)
router.post('/bid-draft', requireAuth, requireRole('contractor'), ctrl.bidDraft);

// AI-AGENT-COMPARE-01 — مقارنة العروض (عميل فقط)
router.post('/compare-bids', requireAuth, requireRole('customer'), ctrl.compareBids);

// AI-AGENT-ANOMALY-01 — كشف شذوذ التسعير (عميل فقط، ومالك المشروع)
router.post('/detect-anomalies', requireAuth, requireRole('customer'), ctrl.detectAnomalies);

// AI-AGENT-CHAT-01 — شات بوت سياسات المنصة (أي مستخدم مسجل)
router.post('/chat', requireAuth, ctrl.chatbot);

// AI-POLICY-RAG-01 — بوت سياسات المنصة بالأنثروبيك RAG (زوار + مسجلين، rate limited)
router.post('/policy-chat', policyLimiter, optionalAuth, ctrl.policyChat);

// AI-AGENT-ESTIMATE-01 — تقدير سعر مشروع + وصف احترافي مجمّع (Phase 3.2)
// قبول عميل فقط — يستخدم وصف خام + بارامترات الفورم ويرجع JSON كامل
router.post('/estimate-project', requireAuth, requireRole('customer'), ctrl.estimateProject);

module.exports = router;
