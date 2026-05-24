// Material marketplace routes
const express = require('express');
const ctrl = require('../controllers/material.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// عام — قائمة + تفاصيل
router.get('/', ctrl.listProducts);
router.get('/orders/mine', requireAuth, ctrl.myOrders);
router.get('/:id', ctrl.getProduct);

// مقاول فقط — CRUD
router.post('/', requireAuth, requireRole('contractor'),
  upload.fields([{ name: 'images', maxCount: 5 }]),
  ctrl.createProduct
);
router.patch('/:id', requireAuth, requireRole('contractor'), ctrl.updateProduct);
router.delete('/:id', requireAuth, requireRole('contractor'), ctrl.deleteProduct);

// طلب شراء — أي مستخدم مسجل
router.post('/:id/order', requireAuth, ctrl.placeOrder);

// تحديث حالة الطلب — البائع أو المشتري
router.patch('/orders/:orderId', requireAuth, ctrl.updateOrder);

module.exports = router;
