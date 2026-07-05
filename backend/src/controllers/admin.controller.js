// el controller bta3 el admin — review contractors, approve/reject
const { z } = require('zod');
const mongoose = require('mongoose');

const Contractor = require('../models/ContractorProfile');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { logAudit } = require('../utils/audit');

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

// GET /api/admin/contractors/pending/count — عدّاد خفيف للـ sidebar badge
const pendingCount = asyncHandler(async (req, res) => {
  const count = await Contractor.countDocuments({ role: 'contractor', status: 'pending' });
  res.json({ count });
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

  logAudit(req.user._id, 'approve_contractor', 'User', contractor._id, { name: contractor.name });
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

  logAudit(req.user._id, 'reject_contractor', 'User', contractor._id, { name: contractor.name, reason });
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
const Contract = require('../models/Contract');
const AuditLog = require('../models/AuditLog');

const Bid = require('../models/Bid');
const Product = require('../models/Product');
const MaterialOrder = require('../models/MaterialOrder');

const dashboardStats = asyncHandler(async (req, res) => {
  const [
    totalProjects,
    openProjects,
    awardedProjects,
    closedProjects,
    draftProjects,
    cancelledProjects,
    featuredProjects,
    urgentProjects,
    privateProjects,
    totalBids,
    totalContractors,
    pendingContractors,
    totalCustomers,
    openEscrowDisputes,
    openWarrantyClaims,
    totalEscrowResult,
    revenueResult,
    totalProducts,
    totalMaterialOrders,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ status: 'open' }),
    Project.countDocuments({ status: 'awarded' }),
    Project.countDocuments({ status: 'closed' }),
    Project.countDocuments({ status: 'draft' }),
    Project.countDocuments({ status: 'cancelled' }),
    Project.countDocuments({ isFeatured: true }),
    Project.countDocuments({ isUrgent: true }),
    Project.countDocuments({ isPrivate: true }),
    Bid.countDocuments(),
    User.countDocuments({ role: 'contractor' }),
    User.countDocuments({ role: 'contractor', status: 'pending' }),
    User.countDocuments({ role: 'customer' }),
    Escrow.countDocuments({ status: 'disputed' }),
    Contract.countDocuments({ warrantyStatus: 'claimed' }),
    Escrow.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Transaction.aggregate([
      { $match: { type: 'commission', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Product.countDocuments(),
    MaterialOrder.countDocuments(),
  ]);

  res.json({
    projects: {
      total: totalProjects, open: openProjects, awarded: awardedProjects, closed: closedProjects,
      draft: draftProjects, cancelled: cancelledProjects,
      featured: featuredProjects, urgent: urgentProjects, private: privateProjects,
    },
    bids: { total: totalBids },
    users: { contractors: totalContractors, pendingContractors, customers: totalCustomers },
    escrow: {
      totalVolume: totalEscrowResult[0]?.total || 0,
      // نزاعات الـ Escrow + مطالبات الضمان — يطابق قائمة النزاعات المدمجة
      openDisputes: openEscrowDisputes + openWarrantyClaims,
    },
    revenue: {
      totalCommission: revenueResult[0]?.total || 0,
    },
    materials: { products: totalProducts, orders: totalMaterialOrders },
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

  logAudit(req.user._id, 'create_reviewer', 'User', admin._id, { name, email: admin.email, permissions: permsToSave });
  logger.info({ adminId: admin._id.toString(), createdBy: req.user._id.toString(), permissions: permsToSave }, 'Reviewer admin created');
  res.status(201).json({ admin: admin.toJSON() });
});

// PATCH /api/admin/reviewers/:id/permissions — super_admin يحدث صلاحيات مراجع
const updateReviewerPermissions = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const permissions = sanitizePermissions(req.body.permissions);

  const admin = await Admin.findOne({ _id: req.params.id, role: 'admin' });
  if (!admin) throw new AppError('المراجع غير موجود', 404, 'NOT_FOUND');

  const oldPermissions = [...(admin.permissions || [])];
  admin.permissions = permissions;
  await admin.save();

  logAudit(req.user._id, 'update_reviewer_permissions', 'User', admin._id, { name: admin.name, oldPermissions, newPermissions: permissions });
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
  logAudit(req.user._id, 'delete_reviewer', 'User', admin._id, { name: admin.name, email: admin.email });
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

  logAudit(req.user._id, 'update_settings', 'Settings', null, { keys: Object.keys(settings), values: results });
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
  logAudit(req.user._id, 'update_terms', 'Settings', null, { length: terms.length });
  logger.info({ adminId: req.user._id.toString() }, 'Terms and conditions updated');
  res.json({ ok: true });
});

// GET /api/admin/disputes — كل النزاعات المفتوحة (Escrow + مطالبات الضمان)
const listDisputes = asyncHandler(async (req, res) => {
  const { status = 'disputed', page = 1, limit = 20 } = req.query;

  const escrowFilter = {};
  if (status) escrowFilter.status = status;

  // مطالبات الضمان ليها مفردات حالة مختلفة عن الـ Escrow —
  // بتظهر في القائمة المدمجة بس لما الفلتر 'disputed'
  const includeContracts = status === 'disputed';

  // سقف للاستعلامين — الدمج بيحصل في الذاكرة فلازم نمنع التحميل غير المحدود
  const MERGE_QUERY_CAP = 200;

  const [escrows, contracts] = await Promise.all([
    Escrow.find(escrowFilter)
      .populate('project', 'title projectType propertyDetails')
      .populate('customer', 'name email phone')
      .populate('contractor', 'name email phone specialty')
      .populate('disputeOpenedBy', 'name role')
      .sort({ disputeOpenedAt: -1 })
      .limit(MERGE_QUERY_CAP)
      .lean(),
    includeContracts
      ? Contract.find({ warrantyStatus: 'claimed' })
          .populate('project', 'title projectType propertyDetails')
          .populate('customer', 'name email phone')
          .populate('contractor', 'name email phone specialty')
          .sort({ 'warrantyClaim.claimedAt': -1 })
          .limit(MERGE_QUERY_CAP)
          .lean()
      : Promise.resolve([]),
  ]);

  const contractDisputes = contracts.map(c => ({
    _id: c._id,
    type: 'contract',
    project: c.project,
    customer: c.customer,
    contractor: c.contractor,
    disputeReason: c.warrantyClaim?.reason || 'مطالبة بضمان العقد',
    disputeOpenedAt: c.warrantyClaim?.claimedAt || c.updatedAt,
    disputeOpenedBy: c.customer,
    status: 'disputed'
  }));

  const escrowDisputes = escrows.map(e => ({
    ...e,
    type: 'escrow'
  }));

  const allDisputes = [...escrowDisputes, ...contractDisputes].sort((a, b) => {
    return new Date(b.disputeOpenedAt || 0) - new Date(a.disputeOpenedAt || 0);
  });

  const total = allDisputes.length;
  const skip = (Number(page) - 1) * Number(limit);
  const paginatedDisputes = allDisputes.slice(skip, skip + Number(limit));

  res.json({ disputes: paginatedDisputes, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// GET /api/admin/permissions — قائمة الصلاحيات المتاحة (للواجهة)
const listAvailablePermissions = asyncHandler(async (req, res) => {
  res.json({ permissions: VALID_PERMISSIONS });
});

// GET /api/admin/audit-log — سجل عمليات الإدارة (super_admin فقط)
const listAuditLog = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.admin && mongoose.Types.ObjectId.isValid(req.query.admin)) filter.admin = req.query.admin;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('admin', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ items, pagination: { total, page, pages: Math.ceil(total / limit) } });
});

// =====================================================
// إدارة سوق المواد (manage_materials)
// =====================================================

const CreditLedger = require('../models/CreditLedger');

// GET /api/admin/materials — كل المنتجات (بما فيها المخفية) + إحصائيات
const listAllMaterials = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total, orders] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'name phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(filter),
    MaterialOrder.find()
      .populate('product', 'name')
      .populate('buyer', 'name')
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
  ]);

  res.json({ products, orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// DELETE /api/admin/materials/:id — حذف منتج مخالف
const adminDeleteProduct = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('المنتج غير موجود', 404, 'NOT_FOUND');
  await product.deleteOne();
  logAudit(req.user._id, 'admin_delete_product', 'Product', product._id, { name: product.name });
  res.json({ ok: true, message: 'تم حذف المنتج' });
});

// =====================================================
// تعديل رصيد النقاط (adjust_credits)
// =====================================================

// GET /api/admin/contractors/search?q= — بحث عن مقاول بالاسم/الإيميل/الهاتف
const searchContractors = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = { role: 'contractor' };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }
  const contractors = await Contractor.find(filter)
    .select('name email phone specialty status creditBalance')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json({ contractors });
});

// POST /api/admin/contractors/:id/credits — تعديل رصيد النقاط (+/-)
const adjustCredits = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const delta = Number(req.body.delta);
  const note = String(req.body.note || '').trim();

  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000) {
    throw new AppError('قيمة التعديل يجب أن تكون عدداً صحيحاً غير صفري (بحد أقصى ±1000)', 400, 'VALIDATION_ERROR');
  }
  if (note.length < 3) {
    throw new AppError('يجب كتابة سبب التعديل (3 أحرف على الأقل)', 400, 'VALIDATION_ERROR');
  }

  const contractor = await Contractor.findOne({ _id: req.params.id, role: 'contractor' });
  if (!contractor) throw new AppError('المقاول غير موجود', 404, 'NOT_FOUND');

  const currentBalance = typeof contractor.creditBalance === 'number' ? contractor.creditBalance : 0;
  const newBalance = currentBalance + delta;
  if (newBalance < 0) {
    throw new AppError(`لا يمكن خصم ${Math.abs(delta)} نقطة — الرصيد الحالي ${currentBalance} فقط`, 400, 'INSUFFICIENT_BALANCE');
  }

  contractor.creditBalance = newBalance;
  await contractor.save();

  await CreditLedger.create({
    user: contractor._id,
    delta,
    reason: 'admin_adjust',
    balanceAfter: newBalance,
    meta: `تعديل إداري: ${note}`,
  });

  logAudit(req.user._id, 'adjust_credits', 'User', contractor._id, { delta, note, balanceAfter: newBalance });
  logger.info({ contractorId: contractor._id.toString(), delta, newBalance }, 'Credits adjusted by admin');
  res.json({ ok: true, creditBalance: newBalance });
});

module.exports = {
  listPending, pendingCount, approveContractor, rejectContractor,
  listAllProjects, dashboardStats, listDisputes,
  createReviewer, listReviewers, deleteReviewer,
  updateReviewerPermissions, listAvailablePermissions,
  getSettings, updateSettings,
  getTerms, updateTerms,
  listAuditLog,
  listAllMaterials, adminDeleteProduct,
  searchContractors, adjustCredits,
};
