// el upload routes — project photos (images only, max 10)
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { requireAuth, requireRole } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const env = require('../config/env');

const router = express.Router();

// =====================================================
// MULTER — project photos instance (images only, max 10)
// =====================================================

const uploadsDir = path.resolve(env.UPLOADS_DIR);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const projectPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const rand = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proj_${Date.now()}_${rand}${ext}`);
  },
});

function imageFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!IMAGE_MIMES.has(file.mimetype) || !IMAGE_EXTS.has(ext)) {
    return cb(new AppError('صور فقط (JPG/PNG/WebP)', 400, 'INVALID_FILE_TYPE'));
  }
  cb(null, true);
}

const projectUpload = multer({
  storage: projectPhotoStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
    files: 10,
  },
});

// =====================================================
// ROUTE
// =====================================================

// POST /api/uploads/project-photos — customer only
router.post(
  '/project-photos',
  requireAuth,
  requireRole('customer'),
  projectUpload.array('photos', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new AppError('لم يتم رفع أي صور', 400, 'NO_FILES');
    }

    const photos = req.files.map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      uploadedAt: new Date(),
    }));

    res.status(201).json({ photos });
  })
);

module.exports = router;
