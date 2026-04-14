// helpers lel cookies el amena — httpOnly + secure + sameSite strict
const env = require('../config/env');

// el esm el mawhed bta3 el refresh cookie
const REFRESH_COOKIE = 'elm_rt';

// byzabat el options el sa7 lel cookie 7asb el env
function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: env.IS_PROD,
    sameSite: 'strict',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
  };
}

// by7ot el refresh token fel cookie
function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// by-clear el refresh cookie (logout)
function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions());
}

module.exports = { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE };
