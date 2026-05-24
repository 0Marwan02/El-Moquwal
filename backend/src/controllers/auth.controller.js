// el controller el re2eesy lel auth — register, login, refresh, logout, me, OTP, password reset
const crypto = require('crypto');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const Customer = require('../models/CustomerProfile');
const Contractor = require('../models/ContractorProfile');
const GuestSession = require('../models/GuestSession');
const CreditLedger = require('../models/CreditLedger');
require('../models/Project');
require('../models/Bid');

const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE } = require('../utils/cookies');
const { parseNID } = require('../utils/nationalId');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { cleanupFiles } = require('../middleware/upload');
const logger = require('../utils/logger');
const { INITIAL_CONTRACTOR_CREDITS, COST_DEFAULT, COST_ABOVE_1M } = require('../utils/credits');
const { sendOTP, sendPasswordReset } = require('../utils/mailer');
const env = require('../config/env');

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

  // Send OTP for email verification
  let otpSent = false;
  try {
    const code = generateOTP();
    customer.otp = {
      code,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000),
    };
    await customer.save();
    await sendOTP(customer.email, code);
    otpSent = true;
  } catch (otpErr) {
    logger.warn({ err: otpErr.message, userId: customer._id.toString() }, 'OTP send failed on registration');
  }

  logger.info({ userId: customer._id.toString(), role: 'customer' }, 'Customer registered');
  res.status(201).json({
    user: customer.toJSON(),
    accessToken,
    otpRequired: !customer.isEmailVerified,
    otpSent,
  });
});

// POST /api/auth/register/contractor — multipart (certificate + membershipCard)
const registerContractor = asyncHandler(async (req, res) => {
  try {
    const data = contractorRegisterSchema.parse(req.body);

    // nationalIdPhoto is mandatory — certificate, membershipCard, profilePicture optional
    if (!req.files || !req.files.nationalIdPhoto) {
      cleanupFiles(req.files);
      throw new AppError('لازم ترفع صورة بطاقة الرقم القومي', 400, 'FILES_REQUIRED');
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
    const cert = req.files.certificate?.[0];
    const card = req.files.membershipCard?.[0];
    const nidPhoto = req.files.nationalIdPhoto[0];
    const avatar = req.files.profilePicture?.[0];

    function fileDoc(f) {
      if (!f) return null;
      return { filename: f.filename, originalName: f.originalname, mimetype: f.mimetype, size: f.size };
    }

    // el contractor byetla3 be status pending le 7ad ma el admin y2blo
    const contractor = await Contractor.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      nationalIdHash: nidHash,
      nationalIdLast4: data.nationalId.slice(-4),
      status: 'pending',
      creditBalance: INITIAL_CONTRACTOR_CREDITS,
      specialty: data.specialty,
      yearsOfExperience: data.yearsOfExperience,
      bio: data.bio,
      certificate: fileDoc(cert),
      membershipCard: fileDoc(card),
      nationalIdPhoto: fileDoc(nidPhoto),
      profilePicture: fileDoc(avatar),
    });

    // issue tokens immediately so contractor lands on their profile
    const { accessToken, refreshToken } = issueTokens(contractor);
    setRefreshCookie(res, refreshToken);

    logger.info({ userId: contractor._id.toString() }, 'Contractor registered (pending)');
    const userJson = contractor.toJSON();
    const bal =
      typeof userJson.creditBalance === 'number' && !Number.isNaN(userJson.creditBalance)
        ? userJson.creditBalance
        : INITIAL_CONTRACTOR_CREDITS;
    res.status(201).json({
      message: 'تم استلام طلبك بنجاح. الإدارة هتراجع حسابك وترد عليك قريب.',
      user: userJson,
      wallet: {
        creditBalance: bal,
        bidCreditCost: { default: COST_DEFAULT, above_1m: COST_ABOVE_1M },
      },
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

  const ok = await verifyPassword(user.passwordHash, data.password);
  if (!ok) {
    throw new AppError('بيانات غير صحيحة', 401, 'INVALID_CREDENTIALS');
  }

  // law el contractor pending ma ysm7sh y2bol el login bel dashboard
  if (user.status === 'suspended') {
    throw new AppError('الحساب موقوف', 403, 'SUSPENDED');
  }

  // email verification check (disabled by default for dev)
  if (env.REQUIRE_EMAIL_VERIFICATION && !user.isEmailVerified && user.role !== 'admin' && user.role !== 'super_admin') {
    throw new AppError('برجاء تفعيل حسابك عبر البريد الإلكتروني أولاً', 403, 'EMAIL_NOT_VERIFIED');
  }

  user.lastLoginAt = new Date();

  // 🎉 capture + reset el welcome flag atomically (one-time use)
  const showWelcome = user.role === 'contractor' && user.firstLoginAfterActivation === true;
  if (showWelcome) {
    user.firstLoginAfterActivation = false;
  }

  await user.save();

  const { accessToken, refreshToken } = issueTokens(user);
  setRefreshCookie(res, refreshToken);

  logger.info({ userId: user._id.toString(), role: user.role }, 'User logged in');
  const payload = { user: user.toJSON(), accessToken };
  if (user.role === 'contractor') {
    const u = payload.user;
    const bal =
      typeof u.creditBalance === 'number' && !Number.isNaN(u.creditBalance)
        ? u.creditBalance
        : INITIAL_CONTRACTOR_CREDITS;
    payload.wallet = {
      creditBalance: bal,
      bidCreditCost: { default: COST_DEFAULT, above_1m: COST_ABOVE_1M },
    };
    // byba3at lel frontend 3ashan y3rz el welcome modal marra wa7da bas
    if (showWelcome) payload.firstLoginAfterActivation = true;
  }
  res.json(payload);
});

// POST /api/auth/admin/login — separate endpoint lel admin
const adminLogin = asyncHandler(async (req, res) => {
  const data = adminLoginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email, role: { $in: ['admin', 'super_admin'] } }).select('+passwordHash');
  if (!user) throw new AppError('بيانات غير صحيحة', 401, 'INVALID_CREDENTIALS');

  const ok = await verifyPassword(user.passwordHash, data.password);
  if (!ok) {
    throw new AppError('بيانات غير صحيحة', 401, 'INVALID_CREDENTIALS');
  }

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
  if (req.user.role === 'contractor') {
    const bal =
      typeof req.user.creditBalance === 'number' && !Number.isNaN(req.user.creditBalance)
        ? req.user.creditBalance
        : INITIAL_CONTRACTOR_CREDITS;
    return res.json({
      user: req.user,
      wallet: {
        creditBalance: bal,
        bidCreditCost: { default: COST_DEFAULT, above_1m: COST_ABOVE_1M },
      },
    });
  }
  res.json({ user: req.user });
});

const listCreditLedger = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CreditLedger.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('project', 'title status budgetRange')
      .populate('bid', 'status amount')
      .lean(),
    CreditLedger.countDocuments({ user: req.user._id }),
  ]);

  res.json({
    items,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

// ======================================================
// OTP — تفعيل الحساب
// ======================================================

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp — بيبعت OTP للبريد (أو بيعمله resend)
const sendOTPHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('البريد الإلكتروني مطلوب', 400, 'MISSING_EMAIL');

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otp.code +otp.expiresAt');
  if (!user) throw new AppError('البريد غير مسجل', 404, 'NOT_FOUND');
  if (user.isEmailVerified) return res.json({ ok: true, message: 'الحساب مفعل بالفعل' });

  const code = generateOTP();
  user.otp = {
    code,
    expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000),
  };
  await user.save();
  await sendOTP(user.email, code);

  res.json({ ok: true, message: 'تم إرسال كود التفعيل لبريدك الإلكتروني' });
});

// POST /api/auth/verify-otp
const verifyOTPHandler = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) throw new AppError('البريد والكود مطلوبان', 400, 'MISSING_FIELDS');

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otp.code +otp.expiresAt');
  if (!user) throw new AppError('البريد غير مسجل', 404, 'NOT_FOUND');
  if (user.isEmailVerified) return res.json({ ok: true, message: 'الحساب مفعل بالفعل' });

  if (!user.otp?.code || !user.otp?.expiresAt) {
    throw new AppError('لا يوجد كود تفعيل. أعد الإرسال.', 400, 'NO_OTP');
  }
  if (new Date() > user.otp.expiresAt) {
    throw new AppError('كود التفعيل منتهي الصلاحية', 400, 'OTP_EXPIRED');
  }
  if (user.otp.code !== code.trim()) {
    throw new AppError('كود التفعيل غير صحيح', 400, 'OTP_INVALID');
  }

  user.isEmailVerified = true;
  user.otp = { code: null, expiresAt: null };
  await user.save();

  logger.info({ userId: user._id.toString() }, 'Email verified via OTP');
  res.json({ ok: true, message: 'تم تفعيل حسابك بنجاح!' });
});

// ======================================================
// PASSWORD RESET
// ======================================================

// POST /api/auth/forgot-password
const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('البريد الإلكتروني مطلوب', 400, 'MISSING_EMAIL');

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // دايماً نرد بنجاح (security — ما نكشفش لو الإيميل مسجل ولا لأ)
  if (!user) return res.json({ ok: true, message: 'لو البريد مسجل عندنا، هتلاقي رسالة فيها رابط إعادة تعيين كلمة المرور.' });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetToken = {
    hash: tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // ساعة واحدة
  };
  await user.save();
  await sendPasswordReset(user.email, rawToken);

  res.json({ ok: true, message: 'لو البريد مسجل عندنا، هتلاقي رسالة فيها رابط إعادة تعيين كلمة المرور.' });
});

// POST /api/auth/reset-password
const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) throw new AppError('التوكن وكلمة المرور مطلوبان', 400, 'MISSING_FIELDS');
  if (newPassword.length < 1) throw new AppError('كلمة المرور مطلوبة', 400, 'WEAK_PASSWORD');

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    'resetToken.hash': tokenHash,
    'resetToken.expiresAt': { $gt: new Date() },
  }).select('+resetToken.hash +resetToken.expiresAt');

  if (!user) throw new AppError('رابط إعادة التعيين غير صالح أو منتهي', 400, 'INVALID_RESET_TOKEN');

  user.passwordHash = await hashPassword(newPassword);
  user.resetToken = { hash: null, expiresAt: null };
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  logger.info({ userId: user._id.toString() }, 'Password reset successful');
  res.json({ ok: true, message: 'تم إعادة تعيين كلمة المرور بنجاح. سجل دخولك الآن.' });
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
  listCreditLedger,
  sendOTPHandler,
  verifyOTPHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
};
