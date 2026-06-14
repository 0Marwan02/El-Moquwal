// Payment controller — escrow, credits, disputes, Paymob webhook
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Escrow = require('../models/Escrow');
const Contractor = require('../models/ContractorProfile');
const CreditLedger = require('../models/CreditLedger');
const PlatformSettings = require('../models/PlatformSettings');
const Project = require('../models/Project');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { logAudit } = require('../utils/audit');
const env = require('../config/env');
const { v4: uuidv4 } = require('uuid');

// POST /api/payments/purchase-credits — شراء نقاط (وهمي)
const purchaseCredits = asyncHandler(async (req, res) => {
  const { packs } = req.body;
  const packCount = Math.max(1, Number(packs) || 1);
  const packPrice = await PlatformSettings.getSetting('creditPackPriceEGP') || 50;
  const packAmount = await PlatformSettings.getSetting('creditPackAmount') || 5;
  const totalPrice = packPrice * packCount;
  const totalCredits = packAmount * packCount;

  // Mock payment — always succeeds
  const txn = await Transaction.create({
    user: req.user._id,
    type: 'credit_purchase',
    amount: totalPrice,
    status: 'success',
    gateway: 'mock',
    gatewayTransactionId: `MOCK-${uuidv4().slice(0, 8)}`,
    meta: { packs: packCount, creditsPerPack: packAmount },
  });

  const contractor = await Contractor.findById(req.user._id);
  if (!contractor) throw new AppError('المقاول غير موجود', 404, 'NOT_FOUND');
  contractor.creditBalance = (contractor.creditBalance || 0) + totalCredits;
  await contractor.save();

  await CreditLedger.create({
    user: req.user._id,
    delta: totalCredits,
    reason: 'purchase',
    balanceAfter: contractor.creditBalance,
    meta: `شراء ${packCount} حزمة (${totalCredits} نقطة) — ${totalPrice} جنيه`,
  });

  logger.info({ userId: req.user._id.toString(), credits: totalCredits }, 'Credits purchased');
  res.json({ ok: true, transaction: txn, creditBalance: contractor.creditBalance, creditsAdded: totalCredits });
});

// POST /api/payments/deposit-escrow — إيداع ضمان للمشروع
const depositEscrow = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');
  if (project.postedBy.toString() !== req.user._id.toString()) throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  if (project.status !== 'awarded') throw new AppError('المشروع لازم يكون مُرسى', 400, 'NOT_AWARDED');

  const existing = await Escrow.findOne({ project: project._id });
  if (existing) return res.json({ escrow: existing, existing: true });

  const Bid = require('../models/Bid');
  const bid = await Bid.findById(project.awardedBidId);
  if (!bid) throw new AppError('العرض غير موجود', 404, 'BID_NOT_FOUND');

  const commissionRate = await PlatformSettings.getSetting('commissionRate') || 0.02;
  const commissionAmount = Math.round(bid.amount * commissionRate);
  const netAmount = bid.amount - commissionAmount;

  // Create default milestones (3 stages)
  const milestones = [
    { title: 'دفعة البداية (30%)', amount: Math.round(netAmount * 0.3), percentage: 30 },
    { title: 'دفعة منتصف المشروع (40%)', amount: Math.round(netAmount * 0.4), percentage: 40 },
    { title: 'دفعة التسليم النهائي (30%)', amount: netAmount - Math.round(netAmount * 0.3) - Math.round(netAmount * 0.4), percentage: 30 },
  ];

  // Mock deposit transaction
  const txn = await Transaction.create({
    user: req.user._id,
    type: 'escrow_deposit',
    amount: bid.amount,
    status: 'success',
    gateway: 'mock',
    gatewayTransactionId: `ESCROW-${uuidv4().slice(0, 8)}`,
    relatedProject: project._id,
  });

  // Commission transaction
  await Transaction.create({
    user: req.user._id,
    type: 'commission',
    amount: commissionAmount,
    status: 'success',
    gateway: 'mock',
    relatedProject: project._id,
    meta: { rate: commissionRate },
  });

  const escrow = await Escrow.create({
    project: project._id,
    customer: project.postedBy,
    contractor: project.awardedTo,
    totalAmount: bid.amount,
    commissionAmount,
    netAmount,
    milestones,
  });

  logger.info({ escrowId: escrow._id.toString(), projectId: project._id.toString() }, 'Escrow deposited');
  res.status(201).json({ escrow, transaction: txn });
});

// POST /api/payments/:projectId/release-milestone — صرف مرحلة
const releaseMilestone = asyncHandler(async (req, res) => {
  const escrow = await Escrow.findOne({ project: req.params.projectId });
  if (!escrow) throw new AppError('لا يوجد ضمان لهذا المشروع', 404, 'NOT_FOUND');
  if (escrow.customer.toString() !== req.user._id.toString()) throw new AppError('غير مصرح', 403, 'FORBIDDEN');

  const { milestoneId } = req.body;
  const milestone = escrow.milestones.id(milestoneId);
  if (!milestone) throw new AppError('المرحلة غير موجودة', 404, 'MILESTONE_NOT_FOUND');
  if (milestone.status === 'released') throw new AppError('تم صرف هذه المرحلة بالفعل', 409, 'ALREADY_RELEASED');

  milestone.status = 'released';
  milestone.releasedAt = new Date();

  // Check if all milestones released
  const allReleased = escrow.milestones.every((m) => m.status === 'released');
  escrow.status = allReleased ? 'released' : 'partially_released';
  if (allReleased) escrow.fullyReleasedAt = new Date();
  await escrow.save();

  // Release transaction
  await Transaction.create({
    user: escrow.contractor,
    type: 'escrow_release',
    amount: milestone.amount,
    status: 'success',
    gateway: 'mock',
    relatedProject: escrow.project,
    meta: { milestoneTitle: milestone.title },
  });

  logger.info({ milestoneId, projectId: req.params.projectId }, 'Milestone released');
  res.json({ escrow });
});

// GET /api/payments/escrow/:projectId — حالة الضمان
const getEscrow = asyncHandler(async (req, res) => {
  const escrow = await Escrow.findOne({ project: req.params.projectId })
    .populate('customer', 'name')
    .populate('contractor', 'name')
    .lean();
  if (!escrow) throw new AppError('لا يوجد ضمان', 404, 'NOT_FOUND');
  res.json({ escrow });
});

// POST /api/payments/webhook/paymob — Paymob transaction webhook with HMAC verification
const processPaymobWebhook = asyncHandler(async (req, res) => {
  const hmacSecret = env.PAYMOB_HMAC_SECRET;

  if (hmacSecret) {
    // Paymob HMAC: specific fields concatenated in a defined order
    const obj = req.body?.obj || {};
    const hmacData = [
      obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
      obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
      obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
      obj.is_voided, obj.order?.id, obj.owner, obj.pending,
      obj.source_data?.pan, obj.source_data?.sub_type, obj.source_data?.type,
      obj.success,
    ].join('');

    const expectedHmac = crypto
      .createHmac('sha512', hmacSecret)
      .update(hmacData)
      .digest('hex');

    const receivedHmac = req.query.hmac || req.headers['hmac'];
    if (!receivedHmac || expectedHmac !== receivedHmac) {
      logger.warn({ receivedHmac }, 'Paymob webhook HMAC mismatch — ignoring');
      return res.status(401).json({ ok: false, error: 'Invalid HMAC' });
    }
  }

  const { obj: txObj, type } = req.body || {};
  if (!txObj) return res.json({ ok: true }); // ping / non-transaction event

  logger.info({ type, success: txObj.success, orderId: txObj.order?.id }, 'Paymob webhook received');

  if (txObj.success && type === 'TRANSACTION') {
    // Map Paymob order ID to internal transaction by gatewayTransactionId
    const internalTxn = await Transaction.findOne({ gatewayTransactionId: String(txObj.id) });
    if (internalTxn && internalTxn.status === 'pending') {
      internalTxn.status = 'success';
      internalTxn.meta = { ...internalTxn.meta, paymobResponse: txObj };
      await internalTxn.save();
      logger.info({ txnId: internalTxn._id.toString() }, 'Transaction confirmed via Paymob webhook');
    }
  }

  res.json({ ok: true });
});

// POST /api/payments/:projectId/dispute — open a dispute on an escrow milestone
const openDispute = asyncHandler(async (req, res) => {
  const escrow = await Escrow.findOne({ project: req.params.projectId });
  if (!escrow) throw new AppError('لا يوجد ضمان لهذا المشروع', 404, 'NOT_FOUND');

  const isParty =
    escrow.customer.toString() === req.user._id.toString() ||
    escrow.contractor.toString() === req.user._id.toString();
  if (!isParty) throw new AppError('غير مصرح', 403, 'FORBIDDEN');

  const { milestoneId, reason } = req.body;
  if (!reason || reason.trim().length < 10) {
    throw new AppError('يجب توضيح سبب النزاع (10 أحرف على الأقل)', 400, 'MISSING_REASON');
  }

  if (milestoneId) {
    const milestone = escrow.milestones.id(milestoneId);
    if (!milestone) throw new AppError('المرحلة غير موجودة', 404, 'MILESTONE_NOT_FOUND');
    if (milestone.status === 'released') throw new AppError('لا يمكن فتح نزاع على مرحلة مُصرَفة', 400, 'ALREADY_RELEASED');
    milestone.status = 'disputed';
  }

  escrow.status = 'disputed';
  escrow.disputeReason = reason.trim();
  escrow.disputeOpenedAt = new Date();
  escrow.disputeOpenedBy = req.user._id;
  await escrow.save();

  logger.info({ escrowId: escrow._id.toString(), openedBy: req.user._id.toString() }, 'Dispute opened');
  res.json({ ok: true, escrow });
});

// POST /api/payments/:projectId/resolve-dispute — admin resolves a dispute (Level 1.5)
const resolveDispute = asyncHandler(async (req, res) => {
  const escrow = await Escrow.findOne({ project: req.params.projectId });
  if (!escrow) throw new AppError('لا يوجد ضمان', 404, 'NOT_FOUND');
  if (escrow.status !== 'disputed') throw new AppError('لا يوجد نزاع مفتوح على هذا المشروع', 400, 'NO_DISPUTE');

  const { decision, warrantyDeduction, adminNote } = req.body;
  if (!['release_to_contractor', 'refund_to_customer', 'split'].includes(decision)) {
    throw new AppError('القرار غير صحيح. الخيارات: release_to_contractor, refund_to_customer, split', 400, 'INVALID_DECISION');
  }

  // Fetch warranty cap from platform settings (Level 1.5)
  const warrantyCap = env.WARRANTY_CAP_MAX_EGP;
  const warrantyCapPercent = env.WARRANTY_CAP_PERCENT;
  const maxWarrantyAmount = Math.min(
    escrow.totalAmount * warrantyCapPercent,
    warrantyCap
  );

  const deductionAmount = Math.min(Number(warrantyDeduction) || 0, maxWarrantyAmount);

  // Update all disputed milestones based on decision
  escrow.milestones.forEach((m) => {
    if (m.status === 'disputed') {
      m.status = decision === 'refund_to_customer' ? 'refunded' : 'released';
      if (decision !== 'refund_to_customer') m.releasedAt = new Date();
    }
  });

  escrow.status = decision === 'refund_to_customer' ? 'refunded' : 'released';
  escrow.disputeResolution = { decision, warrantyDeduction: deductionAmount, adminNote: adminNote || '', resolvedAt: new Date(), resolvedBy: req.user._id };
  if (decision !== 'refund_to_customer') escrow.fullyReleasedAt = new Date();
  await escrow.save();

  // Record warranty payout transaction if applicable
  if (deductionAmount > 0) {
    await Transaction.create({
      user: escrow.customer,
      type: 'warranty_payout',
      amount: deductionAmount,
      status: 'success',
      gateway: 'platform',
      relatedProject: escrow.project,
      meta: { decision, adminNote },
    });
  }

  logAudit(req.user._id, 'resolve_escrow_dispute', 'Escrow', escrow._id, { decision, deductionAmount, project: escrow.project });
  logger.info({ escrowId: escrow._id.toString(), decision, deductionAmount }, 'Dispute resolved by admin');
  res.json({ ok: true, escrow });
});

// POST /api/billing/feature-project — يمنح مشروع العميل شارة "مميز" مقابل رسوم وهمية
const featureProject = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) throw new AppError('معرّف المشروع مطلوب', 400, 'MISSING_PROJECT');

  const project = await Project.findById(projectId);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');
  if (project.postedBy.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح — هذا المشروع ليس لك', 403, 'FORBIDDEN');
  }
  // التمييز يرفع ظهور المشروع لجذب العروض — منطقي بس للمشاريع المفتوحة
  if (project.status !== 'open') {
    throw new AppError('لا يمكن تمييز مشروع غير مفتوح (المشاريع المرسّاة أو المغلقة لا تستقبل عروضاً)', 400, 'PROJECT_NOT_OPEN');
  }
  if (project.isFeatured && project.featuredUntil && project.featuredUntil > new Date()) {
    throw new AppError('المشروع مميز بالفعل حتى ' + project.featuredUntil.toLocaleDateString('ar-EG'), 409, 'ALREADY_FEATURED');
  }

  const featureFee = await PlatformSettings.getSetting('featureProjectFeeEGP') || 99;

  // Mock payment — always succeeds in test env
  const txn = await Transaction.create({
    user: req.user._id,
    type: 'featured_project',
    amount: featureFee,
    status: 'success',
    gateway: 'mock',
    gatewayTransactionId: `FEAT-${uuidv4().slice(0, 8)}`,
    relatedProject: project._id,
    meta: { duration: '30 days' },
  });

  project.isFeatured = true;
  project.featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await project.save();

  logger.info({ projectId: project._id.toString(), fee: featureFee }, 'Project boosted to featured');
  res.json({ ok: true, project, transaction: txn, feeEGP: featureFee });
});

module.exports = { purchaseCredits, depositEscrow, releaseMilestone, getEscrow, processPaymobWebhook, openDispute, resolveDispute, featureProject };
