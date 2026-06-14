// Contract routes
const express = require('express');
const ctrl = require('../controllers/contract.controller');
const { requireAuth, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.post('/generate', requireAuth, ctrl.generateContract);
router.post('/:id/sign', requireAuth, ctrl.signContract);
router.get('/project/:projectId', requireAuth, ctrl.getContractByProject);
router.get('/:id/pdf', requireAuth, ctrl.downloadPDF);
router.get('/:id', requireAuth, ctrl.getContract);
router.post('/:id/claim', requireAuth, requireRole('customer'), ctrl.fileClaim);
router.post('/:id/resolve', requireAuth, requireRole('admin'), requirePermission('manage_disputes'), ctrl.resolveClaim);

module.exports = router;
