// el file da feeh kol el logic bta3 JWT — sign we verify lel access we refresh tokens
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// by3ml sign lel access token — 3omro osayar we feeh el user basic info
function signAccess(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    algorithm: 'HS256',
  });
}

// by3ml sign lel refresh token — 3omro atwal we fel cookie
function signRefresh(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    algorithm: 'HS256',
  });
}

// bey-verify el access token we byraga3 el payload aw by2ool null
function verifyAccess(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    return null;
  }
}

// bey-verify el refresh token
function verifyRefresh(token) {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
