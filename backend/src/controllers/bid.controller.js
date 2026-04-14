// el controller bta3 el bids — Blind Bidding system
const { z } = require('zod');

const Bid = require('../models/Bid');
const Project = require('../models/Project');
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

  const parsed = submitBidSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');

  // بيستخدم upsert — لو الـ contractor بعت من قبل يرجع duplicate error (unique index)
  let bid;
  try {
    bid = await Bid.create({
      project: project._id,
      contractor: req.user._id,
      ...parsed.data,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('لقد قدمت عرضاً على هذا المشروع من قبل', 409, 'BID_EXISTS');
    }
    throw err;
  }

  // زيادة عداد العروض بالـ project
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
