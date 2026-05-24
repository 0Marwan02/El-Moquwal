// Payment routes
const express = require('express');
const ctrl = require('../controllers/payment.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/purchase-credits', requireAuth, requireRole('contractor'), ctrl.purchaseCredits);
router.post('/deposit-escrow', requireAuth, requireRole('customer'), ctrl.depositEscrow);
router.post('/:projectId/release-milestone', requireAuth, requireRole('customer'), ctrl.releaseMilestone);
router.get('/escrow/:projectId', requireAuth, ctrl.getEscrow);

// Dispute system (Level 1.5)
router.post('/:projectId/dispute', requireAuth, ctrl.openDispute);
router.post('/:projectId/resolve-dispute', requireAuth, requireRole('admin'), ctrl.resolveDispute);

// Payment gateway webhooks — no auth, signature-verified internally
router.post('/webhook/paymob', ctrl.processPaymobWebhook);

module.exports = router;
