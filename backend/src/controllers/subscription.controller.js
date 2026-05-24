// Subscription controller — اشتراكات Premium
const Subscription = require('../models/Subscription');
const Contractor = require('../models/ContractorProfile');
const CreditLedger = require('../models/CreditLedger');
const Transaction = require('../models/Transaction');
const PlatformSettings = require('../models/PlatformSettings');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// POST /api/subscriptions/subscribe
const subscribe = asyncHandler(async (req, res) => {
  const contractor = await Contractor.findById(req.user._id);
  if (!contractor) throw new AppError('المقاول غير موجود', 404, 'NOT_FOUND');
  if (contractor.isPremium && contractor.premiumUntil && contractor.premiumUntil > new Date()) {
    return res.json({ ok: true, message: 'أنت مشترك بالفعل', subscription: await Subscription.findById(contractor.subscriptionId) });
  }

  const priceEGP = await PlatformSettings.getSetting('premiumPriceEGP') || 199;
  const monthlyCredits = await PlatformSettings.getSetting('premiumMonthlyCredits') || 10;
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 يوم

  // Mock payment
  const txn = await Transaction.create({
    user: req.user._id, type: 'subscription', amount: priceEGP,
    status: 'success', gateway: 'mock', gatewayTransactionId: `SUB-${uuidv4().slice(0, 8)}`,
  });

  const sub = await Subscription.create({
    user: req.user._id, plan: 'premium', priceEGP,
    endDate, transactionId: txn._id, creditsGranted: monthlyCredits,
  });

  // تحديث بيانات المقاول
  contractor.isPremium = true;
  contractor.subscriptionId = sub._id;
  contractor.premiumUntil = endDate;
  contractor.creditBalance = (contractor.creditBalance || 0) + monthlyCredits;
  await contractor.save();

  // سجل النقاط
  await CreditLedger.create({
    user: req.user._id, delta: monthlyCredits, reason: 'purchase',
    balanceAfter: contractor.creditBalance, meta: `هدية اشتراك Premium — ${monthlyCredits} نقطة`,
  });

  logger.info({ userId: req.user._id.toString() }, 'Premium subscription activated');
  res.status(201).json({ subscription: sub, creditBalance: contractor.creditBalance });
});

// DELETE /api/subscriptions — إلغاء الاشتراك
const cancelSubscription = asyncHandler(async (req, res) => {
  const contractor = await Contractor.findById(req.user._id);
  if (!contractor || !contractor.subscriptionId) {
    throw new AppError('لا يوجد اشتراك فعال', 400, 'NO_SUBSCRIPTION');
  }

  const sub = await Subscription.findById(contractor.subscriptionId);
  if (sub) { sub.status = 'cancelled'; sub.autoRenew = false; await sub.save(); }

  contractor.isPremium = false;
  contractor.subscriptionId = null;
  await contractor.save();

  res.json({ ok: true, message: 'تم إلغاء الاشتراك. ستستمر المزايا حتى انتهاء الفترة المدفوعة.' });
});

// GET /api/subscriptions/me
const getMySubscription = asyncHandler(async (req, res) => {
  const contractor = await Contractor.findById(req.user._id).lean();
  if (!contractor) throw new AppError('غير موجود', 404, 'NOT_FOUND');

  let subscription = null;
  if (contractor.subscriptionId) {
    subscription = await Subscription.findById(contractor.subscriptionId).lean();
  }

  res.json({
    isPremium: contractor.isPremium,
    premiumUntil: contractor.premiumUntil,
    subscription,
  });
});

module.exports = { subscribe, cancelSubscription, getMySubscription };
