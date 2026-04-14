// middleware bta3 el authentication + role guards
const { verifyAccess } = require('../utils/jwt');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

// by-extract el access token men el Authorization header
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// el middleware el re2eesy — by7ot req.user law el token sa7
async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next(new AppError('غير مصرح', 401, 'UNAUTHORIZED'));

    const payload = verifyAccess(token);
    if (!payload) return next(new AppError('جلسة منتهية', 401, 'TOKEN_INVALID'));

    // bngeeb el user fe kol request — bn3rf law mafy2 mesh active
    const user = await User.findById(payload.sub).lean();
    if (!user) return next(new AppError('المستخدم غير موجود', 401, 'USER_NOT_FOUND'));
    if (user.status === 'suspended') return next(new AppError('الحساب موقوف', 403, 'SUSPENDED'));

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    next(err);
  }
}

// factory bey3ml guard bel role — mesalan requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('غير مصرح', 401, 'UNAUTHORIZED'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('غير مصرح بالوصول', 403, 'FORBIDDEN'));
    }
    next();
  };
}

// byosma7 bas lel contractors el approved (active, mesh pending)
function requireApproved(req, res, next) {
  if (!req.user) return next(new AppError('غير مصرح', 401, 'UNAUTHORIZED'));
  if (req.user.status !== 'active') {
    return next(new AppError('الحساب في انتظار مراجعة الإدارة', 403, 'PENDING_APPROVAL'));
  }
  next();
}

// byḥāwil yetḥaqaq men el token — law mawgoud yeset req.user, law mesh mawgoud yekammel bel anonymous
async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next(); // no token — continue as anonymous

    const payload = verifyAccess(token);
    if (!payload) return next(); // invalid/expired — continue as anonymous

    const user = await User.findById(payload.sub).lean();
    if (user && user.status !== 'suspended') {
      req.user = user;
      req.tokenPayload = payload;
    }
    next();
  } catch (_) {
    next(); // any error — continue as anonymous
  }
}

module.exports = { requireAuth, requireRole, requireApproved, optionalAuth };
