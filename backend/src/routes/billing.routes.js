const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// POST /api/billing/purchase-credits — مكان تكامل Paymob/Fawry لاحقاً
router.post(
  '/purchase-credits',
  requireAuth,
  requireRole('contractor'),
  asyncHandler(async (req, res) => {
    throw new AppError('شراء النقاط عبر الدفع قيد التطوير', 501, 'NOT_IMPLEMENTED');
  })
);

module.exports = router;
