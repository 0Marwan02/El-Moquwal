// Referral routes
const express = require('express');
const ctrl = require('../controllers/referral.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/code', requireAuth, ctrl.getMyCode);
router.post('/apply', requireAuth, ctrl.applyCode);

module.exports = router;
