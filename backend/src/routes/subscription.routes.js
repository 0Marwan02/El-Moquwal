// Subscription routes
const express = require('express');
const ctrl = require('../controllers/subscription.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/subscribe', requireAuth, requireRole('contractor'), ctrl.subscribe);
router.delete('/', requireAuth, requireRole('contractor'), ctrl.cancelSubscription);
router.get('/me', requireAuth, requireRole('contractor'), ctrl.getMySubscription);

module.exports = router;
