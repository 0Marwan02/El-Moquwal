// el middleware bta3 multer — file upload amen bel whitelist + random names
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');

// el folder el haynet7at feh el fayelat — khargy el web root
const uploadsDir = path.resolve(env.UPLOADS_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// el mime types el masmoo7a bas (pdf we sowar)
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

// el extensions el masmoo7a
const ALLOWED_EXTS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

// el storage el byh7ot el fayelat bel esm el random
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    // by-generate esm 3ashwa2y 3shan ma7adesh yet3araf 3ala el file
    const random = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${random}${ext}`);
  },
});

// el filter elly by-cha3ek el mime we el ext
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXTS.has(ext)) {
    return cb(new Error('نوع الملف غير مسموح (PDF/JPG/PNG فقط)'));
  }
  cb(null, true);
}

// el multer instance el asasy
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
    files: 4, // certificate + membershipCard + nationalIdPhoto + profilePicture
  },
});

// helper — byms7 fayelat kanet et7aft fe case el request fashal
function cleanupFiles(files) {
  if (!files) return;
  const list = Array.isArray(files) ? files : Object.values(files).flat();
  list.forEach((f) => {
    if (f && f.path && fs.existsSync(f.path)) {
      fs.unlink(f.path, () => {});
    }
  });
}

module.exports = { upload, cleanupFiles, uploadsDir };
