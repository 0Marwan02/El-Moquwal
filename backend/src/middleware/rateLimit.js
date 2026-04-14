// el rate limiters el mo5tlefa lel login, register, admin login
const rateLimit = require('express-rate-limit');

// el response el mwahd law el 7add et3ada
const limitResponse = {
  error: 'محاولات كتيرة، برجاء المحاولة بعد قليل',
  code: 'RATE_LIMITED',
};

// 5 attempts fel 15 dqeq2a lel login el 3ady
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitResponse,
});

// 3 attempts bas lel admin login
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitResponse,
});

// 10 registrations fel sa3a
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitResponse,
});

// general API limiter — 100 request kol 15 dqeq2a
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitResponse,
});

module.exports = { loginLimiter, adminLoginLimiter, registerLimiter, generalLimiter };
