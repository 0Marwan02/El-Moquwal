// Portfolio routes
const express = require('express');
const ctrl = require('../controllers/portfolio.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// عام — عرض محفظة مقاول معين
router.get('/:contractorId', ctrl.getPortfolio);

// مقاول فقط — إضافة عنصر (multipart)
router.post(
  '/',
  requireAuth,
  requireRole('contractor'),
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'beforePhotos', maxCount: 5 },
    { name: 'afterPhotos', maxCount: 5 },
  ]),
  ctrl.addPortfolioItem
);

// مقاول فقط — حذف عنصر يدوي
router.delete('/:id', requireAuth, requireRole('contractor'), ctrl.deletePortfolioItem);

module.exports = router;
