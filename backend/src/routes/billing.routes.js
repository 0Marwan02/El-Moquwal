// Billing routes — مُحدّث: يستخدم payment controller بدل الـ stub
const express = require('express');
const { requireAuth, requireRole, requirePermission } = require('../middleware/auth');
const paymentCtrl = require('../controllers/payment.controller');
const authCtrl = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/billing/purchase-credits — شراء نقاط (يستخدم Mock Payment)
router.post('/purchase-credits', requireAuth, requireRole('contractor'), paymentCtrl.purchaseCredits);

// GET /api/billing/ledger — سجل المعاملات للمقاول (Phase 4.2)
router.get('/ledger', requireAuth, requireRole('contractor'), authCtrl.listCreditLedger);

// GET /api/billing/escrow/:projectId — حالة الضمان
router.get('/escrow/:projectId', requireAuth, paymentCtrl.getEscrow);

// POST /api/billing/feature-project — تمييز مشروع لمدة 30 يوماً (رسوم وهمية)
router.post('/feature-project', requireAuth, requireRole('customer'), paymentCtrl.featureProject);

// POST /api/billing/deposit-escrow — إيداع ضمان
router.post('/deposit-escrow', requireAuth, requireRole('customer'), paymentCtrl.depositEscrow);

// POST /api/billing/:projectId/release-milestone — صرف مرحلة
router.post('/:projectId/release-milestone', requireAuth, requireRole('customer'), paymentCtrl.releaseMilestone);

// POST /api/billing/:projectId/dispute — فتح نزاع
router.post('/:projectId/dispute', requireAuth, paymentCtrl.openDispute);

// POST /api/billing/:projectId/resolve-dispute — حل نزاع (admin)
router.post('/:projectId/resolve-dispute', requireAuth, requireRole('admin', 'super_admin'), requirePermission('manage_disputes'), paymentCtrl.resolveDispute);

module.exports = router;
