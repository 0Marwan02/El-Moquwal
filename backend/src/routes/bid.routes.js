// el bid routes — blind bidding system
const express = require('express');
const ctrl = require('../controllers/bid.controller');
const { requireAuth, requireRole, requireApproved, optionalAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true }); // عشان نوصل لـ :id من el project

// GET /api/projects/:id/bids — متاح للكل، بس الـ response بيتغير حسب الـ role
// optionalAuth: لو في token صح يحط req.user (عشان owner يشوف العروض كاملة)
router.get('/', optionalAuth, ctrl.getBids);

// POST /api/projects/:id/bids — contractors approved only
router.post('/', requireAuth, requireRole('contractor'), requireApproved, ctrl.submitBid);

// PATCH /api/projects/:id/bids/:bidId — project owner only
router.patch('/:bidId', requireAuth, requireRole('customer'), ctrl.respondToBid);

module.exports = router;
