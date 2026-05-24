// el controller bta3 el bids — Blind Bidding system
const { z } = require('zod');

const Bid = require('../models/Bid');
const Project = require('../models/Project');
const Contractor = require('../models/ContractorProfile');
const CreditLedger = require('../models/CreditLedger');
const { getBidCreditCost, INITIAL_CONTRACTOR_CREDITS } = require('../utils/credits');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// =====================================================
// SCHEMAS
// =====================================================

const submitBidSchema = z.object({
  amount: z.number().min(1000, 'الحد الأدنى لقيمة العرض 1000 جنيه').max(100000000, 'قيمة العرض كبيرة بشكل غير منطقي'),
  message: z.string().trim().min(30, 'رسالة العرض لازم تكون واضحة ومفصلة').max(500),
  proposedDurationDays: z.number().int().min(7, 'أقل مدة تنفيذ 7 أيام').max(365, 'أقصى مدة تنفيذ سنة').nullable(),
});

// =====================================================
// HELPERS
// =====================================================

// byshoof el user eih — customer/admin/contractor/public
function getViewerRole(req, project) {
  if (!req.user) return 'public';
  if (req.user.role === 'admin') return 'admin';
  if (project.postedBy.toString() === req.user._id.toString()) return 'owner';
  if (req.user.role === 'contractor') return 'contractor';
  return 'other';
}

// =====================================================
// CONTROLLERS
// =====================================================

// POST /api/projects/:id/bids — contractors only
const submitBid = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');
  if (project.status !== 'open') throw new AppError('المشروع مغلق ولا يقبل عروض', 400, 'PROJECT_CLOSED');

  // private project — check invitation
  if (project.isPrivate) {
    const isInvited = project.invitedContractors.some((id) => id.toString() === req.user._id.toString());
    if (!isInvited) throw new AppError('هذا المشروع خاص ولم تتلق دعوة للتقديم', 403, 'NOT_INVITED');
  }

  const parsed = submitBidSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');

  // Enforce bid limits when project has AI estimate (±30% of estimate range)
  if (project.aiEstimatedPrice?.minEstimate && project.aiEstimatedPrice?.maxEstimate) {
    const minAllowed = Math.floor(project.aiEstimatedPrice.minEstimate * 0.70);
    const maxAllowed = Math.ceil(project.aiEstimatedPrice.maxEstimate * 1.40);
    if (parsed.data.amount < minAllowed || parsed.data.amount > maxAllowed) {
      throw new AppError(
        `قيمة العرض يجب أن تكون بين ${minAllowed.toLocaleString('ar-EG')} و ${maxAllowed.toLocaleString('ar-EG')} جنيه (بناءً على التقدير الذكي للمشروع)`,
        400,
        'BID_OUT_OF_RANGE'
      );
    }
  }

  const creditCost = getBidCreditCost(project);

  const updatedContractor = await Contractor.findOneAndUpdate(
    {
      _id: req.user._id,
      role: 'contractor',
      status: 'active',
      $expr: {
        $gte: [{ $ifNull: ['$creditBalance', INITIAL_CONTRACTOR_CREDITS] }, creditCost],
      },
    },
    [
      {
        $set: {
          creditBalance: {
            $max: [
              0,
              {
                $subtract: [
                  { $ifNull: ['$creditBalance', INITIAL_CONTRACTOR_CREDITS] },
                  creditCost,
                ],
              },
            ],
          },
        },
      },
    ],
    { new: true }
  );

  if (!updatedContractor) {
    const c = await Contractor.findById(req.user._id).select('creditBalance').lean();
    const bal =
      typeof c?.creditBalance === 'number' && !Number.isNaN(c.creditBalance)
        ? c.creditBalance
        : INITIAL_CONTRACTOR_CREDITS;
    throw new AppError(
      `رصيد النقاط غير كافٍ لتقديم العرض. المطلوب ${creditCost} نقطة${creditCost > 1 ? 'ات' : ''} ورصيدك الحالي ${bal} نقطة.`,
      402,
      'INSUFFICIENT_CREDITS'
    );
  }

  let bid;
  try {
    bid = await Bid.create({
      project: project._id,
      contractor: req.user._id,
      ...parsed.data,
    });
  } catch (err) {
    await Contractor.findByIdAndUpdate(req.user._id, { $inc: { creditBalance: creditCost } });
    await CreditLedger.create({
      user: req.user._id,
      delta: creditCost,
      reason: 'bid_submit_refund',
      balanceAfter:
        (typeof updatedContractor.creditBalance === 'number'
          ? updatedContractor.creditBalance
          : 0) + creditCost,
      project: project._id,
      meta: err.code === 11000 ? 'duplicate_bid' : 'bid_create_failed',
    });
    if (err.code === 11000) {
      throw new AppError('لقد قدمت عرضاً على هذا المشروع من قبل', 409, 'BID_EXISTS');
    }
    throw err;
  }

  await CreditLedger.create({
    user: req.user._id,
    delta: -creditCost,
    reason: 'bid_submit',
    balanceAfter: updatedContractor.creditBalance,
    project: project._id,
    bid: bid._id,
  });

  await Project.findByIdAndUpdate(project._id, { $inc: { bidsCount: 1 } });

  // بنرجع للـ contractor عرضه هو بس (مش amount الناس التانية)
  res.status(201).json({
    bid: {
      _id: bid._id,
      project: bid.project,
      amount: bid.amount,
      message: bid.message,
      proposedDurationDays: bid.proposedDurationDays,
      status: bid.status,
      createdAt: bid.createdAt,
    },
    creditsSpent: creditCost,
    creditBalanceAfter: updatedContractor.creditBalance,
  });
});

// GET /api/projects/:id/bids — role-based response (Blind Bidding)
const getBids = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).lean();
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  const role = getViewerRole(req, project);

  // ===== OWNER or ADMIN — full details =====
  if (role === 'owner' || role === 'admin') {
    const bids = await Bid.find({ project: project._id })
      .populate('contractor', 'name phone specialty rating completedProjects')
      .sort({ amount: 1 })
      .lean();

    // Privacy Logic: Hide contractor contact until accepted
    if (role === 'owner') {
      bids.forEach(bid => {
        if (bid.status !== 'accepted' && bid.contractor) {
          delete bid.contractor.phone;
        }
      });
    }

    return res.json({ role, bidsCount: bids.length, bids });
  }

  // ===== CONTRACTOR — يشوف عرضه هو بس + العدد الإجمالي =====
  if (role === 'contractor') {
    const [bidsCount, myBid] = await Promise.all([
      Bid.countDocuments({ project: project._id }),
      Bid.findOne({ project: project._id, contractor: req.user._id })
        .select('amount message proposedDurationDays status createdAt')
        .lean(),
    ]);
    return res.json({
      role,
      bidsCount,
      myBid: myBid || null,
      // ⚠️ bids array فاضي — لا يُرجع عروض المنافسين أبداً
      bids: [],
    });
  }

  // ===== PUBLIC / OTHER — count only =====
  const bidsCount = await Bid.countDocuments({ project: project._id });
  res.json({ role: 'public', bidsCount, bids: [] });
});

// PATCH /api/projects/:id/bids/:bidId — owner only — accept or reject
const respondToBid = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'accept' | 'reject'
  if (!['accept', 'reject'].includes(action)) {
    throw new AppError('action لازم تكون accept أو reject', 400, 'INVALID_ACTION');
  }

  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  if (project.postedBy.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  }

  const bid = await Bid.findOne({ _id: req.params.bidId, project: project._id });
  if (!bid) throw new AppError('العرض غير موجود', 404, 'NOT_FOUND');

  if (action === 'accept') {
    if (project.status === 'awarded') throw new AppError('المشروع له مقاول فعلاً', 409, 'ALREADY_AWARDED');

    // قبول العرض ده — رفض باقي العروض — تحديث المشروع
    bid.status = 'accepted';
    bid.respondedAt = new Date();
    await bid.save();

    await Bid.updateMany(
      { project: project._id, _id: { $ne: bid._id } },
      { status: 'rejected', respondedAt: new Date() }
    );

    project.status = 'awarded';
    project.awardedTo = bid.contractor;
    project.awardedBidId = bid._id;
    project.awardedAt = new Date();
    await project.save();
  } else {
    bid.status = 'rejected';
    bid.respondedAt = new Date();
    if (req.body.reason) bid.rejectionReason = req.body.reason;
    await bid.save();
  }

  res.json({ bid });
});

module.exports = { submitBid, getBids, respondToBid };
