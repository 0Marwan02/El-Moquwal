// el controller el re2eesy lel auth — register, login, refresh, logout, me
const crypto = require('crypto');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const Customer = require('../models/CustomerProfile');
const Contractor = require('../models/ContractorProfile');
const GuestSession = require('../models/GuestSession');

const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE } = require('../utils/cookies');
const { parseNID } = require('../utils/nationalId');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { cleanupFiles } = require('../middleware/upload');
const logger = require('../utils/logger');

// lockout config — ba3d 5 mo7awlat fashla, yetqafel le 15 dqeq2a
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// ======================================================
// SCHEMAS — el zod schemas lel request validation
// ======================================================

// el password policy — strong
const strongPassword = z.string().min(1, 'برجاء إدخال كلمة المرور');

// customer register schema
const customerRegisterSchema = z.object({
  name: z.string().trim().min(3, 'الاسم قصير').max(80),
  nationalId: z.string().regex(/^\d{14}$/, 'الرقم القومي لازم 14 رقم'),
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().regex(/^01[0125]\d{8}$/, 'رقم الهاتف غير صحيح'),
  password: strongPassword,
});

// contractor register schema (el ba2y bye-validate men multer)
const contractorRegisterSchema = z.object({
  name: z.string().trim().min(3).max(80),
  nationalId: z.string().regex(/^\d{14}$/, 'الرقم القومي لازم 14 رقم'),
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().regex(/^01[0125]\d{8}$/, 'رقم الهاتف غير صحيح'),
  password: strongPassword,
  specialty: z.enum([
    'civil_engineer', 'architect', 'electrical', 'plumber',
    'carpenter', 'painter', 'general_contractor', 'finishing', 'other',
  ]),
  yearsOfExperience: z.coerce.number().int().min(0).max(60),
  bio: z.string().max(500).optional().default(''),
});

// login schema — identifier yekoon email aw phone aw nid
const loginSchema = z.object({
  identifier: z.string().trim().min(5, 'برجاء إدخال البريد أو الهاتف'),
  password: z.string().min(1, 'برجاء إدخال كلمة المرور'),
});

// admin login schema — email bas
const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'برجاء إدخال كلمة المرور'),
});

// ======================================================
// HELPERS
// ======================================================

// byraga3 access + refresh tokens lel user
function issueTokens(user) {
  const payload = { sub: user._id.toString(), role: user.role };
  return {
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
  };
}

// byhash el NID bel sha-256
function hashNID(nid) {
  return crypto.createHash('sha256').update(nid).digest('hex');
}

// byshoof law el identifier email, phone, wala nid
function identifyField(identifier) {
  if (/^\d{14}$/.test(identifier)) return { nationalIdHash: hashNID(identifier) };
  if (/^01[0125]\d{8}$/.test(identifier)) return { phone: identifier };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) return { email: identifier.toLowerCase() };
  return null;
}

// ======================================================
// CONTROLLERS
// ======================================================

// POST /api/auth/guest — by3ml aw by7ades guest session
const createGuest = asyncHandler(async (req, res) => {
  // law fe guestId gaay men el client nkhodo, aw n3ml wa7ed gedeed
  let { guestId } = req.body || {};
  if (!guestId || typeof guestId !== 'string' || guestId.length < 8) {
    guestId = uuidv4();
  }

  // upsert — law mawgoud n7dsoh, law la2 n3mlo
  const guest = await GuestSession.findOneAndUpdate(
    { guestId },
    {
      $set: { lastSeenAt: new Date(), userAgent: (req.headers['user-agent'] || '').slice(0, 200) },
      $inc: { visits: 1 },
      $setOnInsert: { guestId },
    },
    { upsert: true, new: true }
  );

  res.json({ guestId: guest.guestId, visits: guest.visits });
});

// POST /api/auth/register/customer
const registerCustomer = asyncHandler(async (req, res) => {
  const data = customerRegisterSchema.parse(req.body);

  // n3ml parse lel NID 3ala el server (ma n2mensh el client)
  const parsed = parseNID(data.nationalId);
  if (!parsed.valid) {
    throw new AppError(parsed.reason || 'الرقم القومي غير صحيح', 400, 'INVALID_NID');
  }

  // law el email aw el NID mawgoudeen net2na3
  const nidHash = hashNID(data.nationalId);
  const existing = await User.findOne({
    $or: [{ email: data.email }, { phone: data.phone }],
  }).lean();
  if (existing) {
    throw new AppError('البريد أو الهاتف مسجل من قبل', 409, 'DUPLICATE');
  }
  const existingNid = await Customer.findOne({ nationalIdHash: nidHash }).lean();
  if (existingNid) {
    throw new AppError('الرقم القومي مسجل من قبل', 409, 'DUPLICATE');
  }

  // hash el password
  const passwordHash = await hashPassword(data.password);

  // n3ml el customer
  const customer = await Customer.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
    status: 'active',
    nationalIdHash: nidHash,
    nationalIdLast4: data.nationalId.slice(-4),
    dob: new Date(parsed.dob),
    gender: parsed.gender,
    governorate: parsed.governorate,
    governorateCode: parsed.governorateCode,
  });

  // byraga3 tokens
  const { accessToken, refreshToken } = issueTokens(customer);
  setRefreshCookie(res, refreshToken);

  logger.info({ userId: customer._id.toString(), role: 'customer' }, 'Customer registered');
  res.status(201).json({
    user: customer.toJSON(),
    accessToken,
  });
});

// POST /api/auth/register/contractor — multipart (certificate + membershipCard)
const registerContractor = asyncHandler(async (req, res) => {
  try {
    const data = contractorRegisterSchema.parse(req.body);

    // lazem el 2 files yebo nfos el request
    if (!req.files || !req.files.certificate || !req.files.membershipCard) {
      cleanupFiles(req.files);
      throw new AppError('لازم ترفع الشهادة وكارنيه النقابة', 400, 'FILES_REQUIRED');
    }

    // n3ml parse lel NID
    const parsedNID = parseNID(data.nationalId);
    if (!parsedNID.valid) {
      cleanupFiles(req.files);
      throw new AppError(parsedNID.reason || 'الرقم القومي غير صحيح', 400, 'INVALID_NID');
    }

    const nidHash = hashNID(data.nationalId);
    const existingNid = await User.findOne({ nationalIdHash: nidHash }).lean();
    if (existingNid) {
      cleanupFiles(req.files);
      throw new AppError('الرقم القومي مسجل من قبل', 409, 'DUPLICATE');
    }

    const existing = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    }).lean();
    if (existing) {
      cleanupFiles(req.files);
      throw new AppError('البريد أو الهاتف مسجل من قبل', 409, 'DUPLICATE');
    }

    const passwordHash = await hashPassword(data.password);
    const cert = req.files.certificate[0];
    const card = req.files.membershipCard[0];

    // el contractor byetla3 be status pending le 7ad ma el admin y2blo
    const contractor = await Contractor.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      nationalIdHash: nidHash,
      nationalIdLast4: data.nationalId.slice(-4),
      status: 'pending',
      specialty: data.specialty,
      yearsOfExperience: data.yearsOfExperience,
      bio: data.bio,
      certificate: {
        filename: cert.filename,
        originalName: cert.originalname,
        mimetype: cert.mimetype,
        size: cert.size,
      },
      membershipCard: {
        filename: card.filename,
        originalName: card.originalname,
        mimetype: card.mimetype,
        size: card.size,
      },
    });

    // issue tokens immediately so contractor lands on their profile
    const { accessToken, refreshToken } = issueTokens(contractor);
    setRefreshCookie(res, refreshToken);

    logger.info({ userId: contractor._id.toString() }, 'Contractor registered (pending)');
    res.status(201).json({
      message: 'تم استلام طلبك بنجاح. الإدارة هتراجع حسابك وترد عليك قريب.',
      user: contractor.toJSON(),
      accessToken,
    });
  } catch (err) {
    // fe ay error nems7 el fayelat
    cleanupFiles(req.files);
    throw err;
  }
});

// POST /api/auth/login — el login el 3adey (customer + contractor)
const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);

  const query = identifyField(data.identifier);
  if (!query) throw new AppError('البريد أو الهاتف غير صحيح', 400, 'INVALID_IDENTIFIER');

  // bngeeb el user ma3a el passwordHash + el nationalIdHash (3ashan login be nid)
  const user = await User.findOne(query).select('+passwordHash +nationalIdHash');
  if (!user) throw new AppError('بيانات غير صحيحة', 401, 'INVALID_CREDENTIALS');

  // admin yestakhdem el main login bas law katab email — lao phone/nid nerefdo
  if (user.role === 'admin' && !('email' in query)) {
    throw new AppError('بيانات غير صحيحة', 401, 'INVALID_CREDENTIALS');
  }

  // check el lockout
  if (user.isLocked && user.isLocked()) {
    throw new AppError('الحساب مقفول مؤقتاً، حاول بعد قليل', 423, 'LOCKED');
  }

  const ok = await verifyPassword(user.passwordHash, data.password);
  if (!ok) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.loginAttempts = 0;
    }
    await user.save();
    throw new AppError('بيانات غير صحيحة', 401, 'INVALID_CREDENTIALS');
  }

  // law el contractor pending ma ysm7sh y2bol el login bel dashboard
  if (user.status === 'suspended') {
    throw new AppError('الحساب موقوف', 403, 'SUSPENDED');
  }

  // reset el counters
  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken } = issueTokens(user);
  setRefreshCookie(res, refreshToken);

  logger.info({ userId: user._id.toString(), role: user.role }, 'User logged in');
  res.json({ user: user.toJSON(), accessToken });
});

// POST /api/auth/admin/login — separate endpoint lel admin
const adminLogin = asyncHandler(async (req, res) => {
  const data = adminLoginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email, role: 'admin' }).select('+passwordHash');
  if (!user) throw new AppError('بيانات غير صحيحة', 401, 'INVALID_CREDENTIALS');

  if (user.isLocked && user.isLocked()) {
    throw new AppError('الحساب مقفول مؤقتاً', 423, 'LOCKED');
  }

  const ok = await verifyPassword(user.passwordHash, data.password);
  if (!ok) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 3) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.loginAttempts = 0;
    }
    await user.save();
    throw new AppError('بيانات غير صحيحة', 401, 'INVALID_CREDENTIALS');
  }

  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken } = issueTokens(user);
  setRefreshCookie(res, refreshToken);

  logger.info({ userId: user._id.toString() }, 'Admin logged in');
  res.json({ user: user.toJSON(), accessToken });
});

// POST /api/auth/refresh — bystkhdem el httpOnly cookie
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new AppError('لا يوجد جلسة', 401, 'NO_REFRESH');

  const payload = verifyRefresh(token);
  if (!payload) {
    clearRefreshCookie(res);
    throw new AppError('جلسة منتهية', 401, 'INVALID_REFRESH');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status === 'suspended') {
    clearRefreshCookie(res);
    throw new AppError('المستخدم غير موجود', 401, 'USER_NOT_FOUND');
  }

  const { accessToken, refreshToken } = issueTokens(user);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  clearRefreshCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = {
  createGuest,
  registerCustomer,
  registerContractor,
  login,
  adminLogin,
  refresh,
  logout,
  me,
};
