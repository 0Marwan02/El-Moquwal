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

const Escrow = require('../models/Escrow');
const Transaction = require('../models/Transaction');

const dashboardStats = asyncHandler(async (req, res) => {
  const [
    totalProjects,
    openProjects,
    awardedProjects,
    closedProjects,
    totalContractors,
    pendingContractors,
    totalCustomers,
    openDisputes,
    totalEscrowResult,
    revenueResult,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ status: 'open' }),
    Project.countDocuments({ status: 'awarded' }),
    Project.countDocuments({ status: 'closed' }),
    User.countDocuments({ role: 'contractor' }),
    User.countDocuments({ role: 'contractor', status: 'pending' }),
    User.countDocuments({ role: 'customer' }),
    Escrow.countDocuments({ status: 'disputed' }),
    Escrow.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Transaction.aggregate([
      { $match: { type: 'commission', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  res.json({
    projects: { total: totalProjects, open: openProjects, awarded: awardedProjects, closed: closedProjects },
    users: { contractors: totalContractors, pendingContractors, customers: totalCustomers },
    escrow: {
      totalVolume: totalEscrowResult[0]?.total || 0,
      openDisputes,
    },
    revenue: {
      totalCommission: revenueResult[0]?.total || 0,
    },
  });
});

// =====================================================
// SUPER ADMIN — إدارة المراجعين والإعدادات
// =====================================================

const Admin = require('../models/AdminProfile');
const PlatformSettings = require('../models/PlatformSettings');
const { hashPassword } = require('../utils/password');

// Source of truth — keeps backend/frontend in sync with the AdminProfile enum
const VALID_PERMISSIONS = [
  'review_contractors',
  'view_projects',
  'view_stats',
  'manage_disputes',
  'manage_featured',
  'manage_materials',
  'adjust_credits',
];

// Returns a clean, deduplicated, validated permissions array.
// Throws AppError on unknown values so we never silently drop a permission.
function sanitizePermissions(input) {
  if (!Array.isArray(input)) {
    throw new AppError('الصلاحيات يجب أن تكون مصفوفة', 400, 'VALIDATION_ERROR');
  }
  const cleaned = [...new Set(input.map((p) => String(p).trim()).filter(Boolean))];
  const unknown = cleaned.filter((p) => !VALID_PERMISSIONS.includes(p));
  if (unknown.length > 0) {
    throw new AppError(`صلاحية غير معروفة: ${unknown.join(', ')}`, 400, 'INVALID_PERMISSION');
  }
  return cleaned;
}

// POST /api/admin/create-reviewer — super_admin ينشئ أدمن مراجع
const createReviewer = asyncHandler(async (req, res) => {
  const { name, email, phone, password, permissions, nationalId } = req.body;
  if (!name || !email || !password || !nationalId) {
    throw new AppError('الاسم والبريد وكلمة المرور والرقم القومي مطلوبين', 400, 'VALIDATION_ERROR');
  }

  // Validate when caller sends permissions; otherwise fall back to a sensible default.
  let permsToSave;
  if (permissions === undefined || permissions === null) {
    permsToSave = ['review_contractors', 'view_projects', 'view_stats'];
  } else {
    permsToSave = sanitizePermissions(permissions);
  }

  const crypto = require('crypto');
  const nidHash = crypto.createHash('sha256').update(nationalId).digest('hex');

  const existing = await User.findOne({ $or: [{ email }, { nationalIdHash: nidHash }] }).lean();
  if (existing) throw new AppError('البريد أو الرقم القومي مسجل من قبل', 409, 'DUPLICATE');

  const passwordHash = await hashPassword(password);

  const admin = await Admin.create({
    name,
    email: email.toLowerCase().trim(),
    phone: phone || '01000000000',
    passwordHash,
    nationalIdHash: nidHash,
    nationalIdLast4: nationalId.slice(-4),
    status: 'active',
    isEmailVerified: true,
    permissions: permsToSave,
    createdBySuperAdmin: req.user._id,
  });

  logger.info({ adminId: admin._id.toString(), createdBy: req.user._id.toString(), permissions: permsToSave }, 'Reviewer admin created');
  res.status(201).json({ admin: admin.toJSON() });
});

// PATCH /api/admin/reviewers/:id/permissions — super_admin يحدث صلاحيات مراجع
const updateReviewerPermissions = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const permissions = sanitizePermissions(req.body.permissions);

  const admin = await Admin.findOne({ _id: req.params.id, role: 'admin' });
  if (!admin) throw new AppError('المراجع غير موجود', 404, 'NOT_FOUND');

  admin.permissions = permissions;
  await admin.save();

  logger.info(
    { adminId: admin._id.toString(), updatedBy: req.user._id.toString(), permissions },
    'Reviewer permissions updated',
  );
  res.json({ ok: true, admin: admin.toJSON() });
});

// GET /api/admin/reviewers — super_admin يشوف كل المراجعين
const listReviewers = asyncHandler(async (req, res) => {
  const reviewers = await Admin.find({ role: 'admin' }).sort({ createdAt: -1 }).lean();
  res.json({ reviewers, total: reviewers.length });
});

// DELETE /api/admin/reviewers/:id — super_admin يحذف مراجع
const deleteReviewer = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const admin = await Admin.findOne({ _id: req.params.id, role: 'admin' });
  if (!admin) throw new AppError('المراجع غير موجود', 404, 'NOT_FOUND');
  await admin.deleteOne();
  logger.info({ adminId: req.params.id, deletedBy: req.user._id.toString() }, 'Reviewer admin deleted');
  res.json({ ok: true, message: 'تم حذف المراجع بنجاح' });
});

// GET /api/admin/settings — عرض إعدادات المنصة
const getSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getAll();
  res.json({ settings });
});

// PATCH /api/admin/settings — تعديل إعدادات المنصة (super_admin فقط)
const updateSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    throw new AppError('الإعدادات مطلوبة', 400, 'VALIDATION_ERROR');
  }

  const results = {};
  for (const [key, value] of Object.entries(settings)) {
    const doc = await PlatformSettings.setSetting(key, value, req.user._id);
    results[key] = doc.value;
  }

  logger.info({ adminId: req.user._id.toString(), keys: Object.keys(settings) }, 'Platform settings updated');
  res.json({ ok: true, settings: results });
});

// GET /api/admin/terms — public-readable terms
const getTerms = asyncHandler(async (req, res) => {
  const terms = await PlatformSettings.getSetting('termsAndConditions');
  const lastUpdated = await PlatformSettings.getSetting('termsLastUpdated');
  res.json({ terms: terms || '', lastUpdated });
});

// PATCH /api/admin/terms — super_admin only
const updateTerms = asyncHandler(async (req, res) => {
  const { terms } = req.body;
  if (typeof terms !== 'string') {
    throw new AppError('محتوى الشروط مطلوب', 400, 'VALIDATION_ERROR');
  }
  await PlatformSettings.setSetting('termsAndConditions', terms, req.user._id);
  await PlatformSettings.setSetting('termsLastUpdated', new Date().toISOString(), req.user._id);
  logger.info({ adminId: req.user._id.toString() }, 'Terms and conditions updated');
  res.json({ ok: true });
});

// GET /api/admin/disputes — كل النزاعات المفتوحة
const listDisputes = asyncHandler(async (req, res) => {
  const { status = 'disputed', page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [disputes, total] = await Promise.all([
    Escrow.find(filter)
      .populate('project', 'title projectType propertyDetails')
      .populate('customer', 'name email phone')
      .populate('contractor', 'name email phone specialty')
      .populate('disputeOpenedBy', 'name role')
      .sort({ disputeOpenedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Escrow.countDocuments(filter),
  ]);

  res.json({ disputes, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// GET /api/admin/permissions — قائمة الصلاحيات المتاحة (للواجهة)
const listAvailablePermissions = asyncHandler(async (req, res) => {
  res.json({ permissions: VALID_PERMISSIONS });
});

module.exports = {
  listPending, approveContractor, rejectContractor,
  listAllProjects, dashboardStats, listDisputes,
  createReviewer, listReviewers, deleteReviewer,
  updateReviewerPermissions, listAvailablePermissions,
  getSettings, updateSettings,
  getTerms, updateTerms,
};
