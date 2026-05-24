// Referral controller — نظام الإحالة
const crypto = require('crypto');
const User = require('../models/User');
const Contractor = require('../models/ContractorProfile');
const CreditLedger = require('../models/CreditLedger');
const PlatformSettings = require('../models/PlatformSettings');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// يولّد كود إحالة فريد (6 أحرف)
function generateReferralCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// GET /api/referral/code — بيجيب الكود (أو بيولّده لأول مرة)
const getMyCode = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user._id);
  if (!user) throw new AppError('المستخدم غير موجود', 404, 'NOT_FOUND');

  if (!user.referralCode) {
    // بنولد كود جديد ونتأكد إنه فريد
    let code;
    let exists = true;
    while (exists) {
      code = generateReferralCode();
      exists = await User.findOne({ referralCode: code }).lean();
    }
    user.referralCode = code;
    await user.save();
  }

  res.json({ referralCode: user.referralCode });
});

// POST /api/referral/apply — بيطبّق كود إحالة على المستخدم الحالي
const applyCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError('كود الإحالة مطلوب', 400, 'MISSING_CODE');

  // لازم المستخدم يكون مقاول (المقاولين بس يستفيدوا من الإحالة)
  if (req.user.role !== 'contractor') {
    throw new AppError('الإحالة متاحة للمقاولين فقط', 400, 'CONTRACTOR_ONLY');
  }

  const contractor = await Contractor.findById(req.user._id);
  if (!contractor) throw new AppError('المقاول غير موجود', 404, 'NOT_FOUND');
  if (contractor.referredBy) {
    throw new AppError('لقد استخدمت كود إحالة من قبل', 409, 'ALREADY_REFERRED');
  }

  const inviter = await User.findOne({ referralCode: code.toUpperCase().trim() });
  if (!inviter) throw new AppError('كود الإحالة غير صحيح', 404, 'INVALID_CODE');
  if (inviter._id.toString() === req.user._id.toString()) {
    throw new AppError('لا يمكن استخدام كود الإحالة الخاص بك', 400, 'SELF_REFERRAL');
  }

  // كافئ صاحب الدعوة
  const bonusCredits = await PlatformSettings.getSetting('referralBonusCredits') || 2;

  // لو صاحب الدعوة مقاول، نزوّد رصيده
  if (inviter.role === 'contractor') {
    const inviterContractor = await Contractor.findById(inviter._id);
    if (inviterContractor) {
      inviterContractor.creditBalance = (inviterContractor.creditBalance || 0) + bonusCredits;
      await inviterContractor.save();
      await CreditLedger.create({
        user: inviter._id,
        delta: bonusCredits,
        reason: 'referral',
        balanceAfter: inviterContractor.creditBalance,
        meta: `إحالة من ${contractor.name}`,
      });
    }
  }

  contractor.referredBy = inviter._id;
  await contractor.save();

  logger.info({ inviterId: inviter._id.toString(), inviteeId: contractor._id.toString() }, 'Referral applied');
  res.json({ ok: true, message: `تم تطبيق كود الإحالة بنجاح. ${inviter.name} حصل على ${bonusCredits} نقاط.` });
});

module.exports = { getMyCode, applyCode };
