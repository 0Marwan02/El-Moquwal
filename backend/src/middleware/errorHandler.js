// el central error handler — by2bel ay error men el app we byraga3 response m7tram
const logger = require('../utils/logger');
const env = require('../config/env');

// el AppError custom class 3ashan nerm bel status code
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// el wrapper el 7elw 3ashan el async controllers — byms7 kol try/catch
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// 404 handler — le 2y route mesh mawgoud
function notFound(req, res, next) {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
}

// el handler el re2eesy
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // law mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'بيانات غير صحيحة',
      code: 'VALIDATION_ERROR',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // law duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'هذه البيانات مسجلة من قبل',
      code: 'DUPLICATE',
    });
  }

  // multer file errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: err.code === 'LIMIT_FILE_SIZE' ? 'حجم الملف أكبر من المسموح' : 'خطأ في رفع الملف',
      code: err.code,
    });
  }

  // custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  // ay haga tanya — 500
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');
  return res.status(500).json({
    error: 'حدث خطأ غير متوقع',
    code: 'INTERNAL_ERROR',
    // ma netla3sh el stack fel prod
    ...(env.IS_PROD ? {} : { debug: err.message }),
  });
}

module.exports = { errorHandler, notFound, AppError, asyncHandler };
