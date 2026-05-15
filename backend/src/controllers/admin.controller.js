// el controller bta3 el admin — review contractors, approve/reject
const { z } = require('zod');
const mongoose = require('mongoose');

const Contractor = require('../models/ContractorProfile');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// schema lel approve/reject action
const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'لازم تكتب سبب الرفض').max(500),
});

// byt2kd en el id sa7 bel mongo
function assertValidId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('معرف غير صحيح', 400, 'INVALID_ID');
  }
}

// GET /api/admin/contractors/pending — kol el contractors el lessa fe el intidhar
const listPending = asyncHandler(async (req, res) => {
  const pending = await Contractor.find({ role: 'contractor', status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ items: pending, total: pending.length });
});

// POST /api/admin/contractors/:id/approve
const approveContractor = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const contractor = await Contractor.findOne({ _id: req.params.id, role: 'contractor' });
  if (!contractor) throw new AppError('المقاول غير موجود', 404, 'NOT_FOUND');
  if (contractor.status === 'active') {
    return res.json({ ok: true, message: 'تم قبول الحساب من قبل' });
  }

  contractor.status = 'active';
  contractor.approvedBy = req.user._id;
  contractor.approvedAt = new Date();
  contractor.rejectionReason = null;
  contractor.firstLoginAfterActivation = true; // 🎉 bybaat el welcome modal 3ala awel login
  await contractor.save();

  logger.info({ contractorId: contractor._id.toString(), adminId: req.user._id.toString() }, 'Contractor approved');
  res.json({ ok: true, user: contractor.toJSON() });
});

// POST /api/admin/contractors/:id/reject
const rejectContractor = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const { reason } = rejectSchema.parse(req.body);

  const contractor = await Contractor.findOne({ _id: req.params.id, role: 'contractor' });
  if (!contractor) throw new AppError('المقاول غير موجود', 404, 'NOT_FOUND');

  contractor.status = 'suspended';
  contractor.rejectionReason = reason;
  await contractor.save();

  logger.info({ contractorId: contractor._id.toString(), adminId: req.user._id.toString() }, 'Contractor rejected');
  res.json({ ok: true, user: contractor.toJSON() });
});

// =====================================================
// GET /api/admin/projects — كل المشاريع بفلترة وترقيم
// =====================================================

const Project = require('../models/Project');

const listAllProjects = asyncHandler(async (req, res) => {
  const {
    status, type, governorate,
    page = 1, limit = 20,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (type) filter.projectType = type;
  if (governorate) filter['propertyDetails.governorate'] = governorate;

  const skip = (Number(page) - 1) * Number(limit);

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('postedBy', 'name email phone')
      .populate('awardedTo', 'name email phone specialty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Project.countDocuments(filter),
  ]);

  res.json({
    projects,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// =====================================================
// GET /api/admin/stats — إحصائيات سريعة للوحة المدير
// =====================================================

const User = require('../models/User');

const dashboardStats = asyncHandler(async (req, res) => {
  const [
    totalProjects,
    openProjects,
    awardedProjects,
    closedProjects,
    totalContractors,
    pendingContractors,
    totalCustomers,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ status: 'open' }),
    Project.countDocuments({ status: 'awarded' }),
    Project.countDocuments({ status: 'closed' }),
    User.countDocuments({ role: 'contractor' }),
    User.countDocuments({ role: 'contractor', status: 'pending' }),
    User.countDocuments({ role: 'customer' }),
  ]);

  res.json({
    projects: { total: totalProjects, open: openProjects, awarded: awardedProjects, closed: closedProjects },
    users: { contractors: totalContractors, pendingContractors, customers: totalCustomers },
  });
});

module.exports = { listPending, approveContractor, rejectContractor, listAllProjects, dashboardStats };
