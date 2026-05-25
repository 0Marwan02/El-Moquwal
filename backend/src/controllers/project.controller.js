// el controller bta3 el projects — CRUD + AI estimate + private/featured/closure
const { z } = require('zod');
const { callLLM, parseJsonResponse, isAIAvailable } = require('../utils/ai.service');

const Project = require('../models/Project');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const env = require('../config/env');
const logger = require('../utils/logger');

// =====================================================
// SCHEMAS
// =====================================================

const createProjectSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().max(1000).optional().default(''),
  projectType: z.enum([
    'new_construction', 'finishing', 'renovation', 'repair',
    'extension', 'demolition', 'electrical', 'plumbing', 'other',
  ]),
  propertyDetails: z.object({
    governorate: z.string().min(2),
    city: z.string().optional().default(''),
    district: z.string().optional().default(''),
    area: z.number().min(10).max(50000),
    floors: z.number().int().min(1).max(30).optional().default(1),
    rooms: z.number().int().min(0).optional().default(0),
    bathrooms: z.number().int().min(0).optional().default(0),
    gpsCoords: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).nullable().optional().default(null),
  }),
  requirements: z.record(z.unknown()).optional().default({}),
  budgetRange: z.enum([
    'under_50k', '50k_200k', '200k_500k', '500k_1m', 'above_1m', 'flexible',
  ]).optional(),
  timeline: z.enum([
    'within_week', 'within_month', '1_3_months', '3_6_months', 'flexible',
  ]).optional(),
  requiredEngineers: z.coerce.number().int().min(0).max(50).optional().default(0),
  isPrivate: z.boolean().optional().default(false),
  invitedContractors: z.array(z.string()).optional().default([]),
  isUrgent: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
});

// =====================================================
// HELPERS
// =====================================================

// bymap el project type le اسم عربي للـ AI prompt
const PROJECT_TYPE_LABELS = {
  new_construction: 'بناء جديد',
  finishing: 'تشطيبات',
  renovation: 'تجديد',
  repair: 'إصلاح',
  extension: 'توسعة',
  demolition: 'هدم',
  electrical: 'أعمال كهربائية',
  plumbing: 'أعمال سباكة',
  other: 'أخرى',
};

const BUDGET_LABELS = {
  under_50k: 'أقل من 50,000 جنيه',
  '50k_200k': '50,000 - 200,000 جنيه',
  '200k_500k': '200,000 - 500,000 جنيه',
  '500k_1m': '500,000 - 1,000,000 جنيه',
  above_1m: 'أكثر من 1,000,000 جنيه',
  flexible: 'مرن',
};

const TIMELINE_LABELS = {
  within_week: 'خلال أسبوع',
  within_month: 'خلال شهر',
  '1_3_months': '1-3 أشهر',
  '3_6_months': '3-6 أشهر',
  flexible: 'مرن',
};

// =====================================================
// MARKET CONTEXT — يجيب بيانات مشاريع مشابهة من المنصة عشان يحسن التقدير
// =====================================================

async function getMarketContext(projectType, governorate, area) {
  const Bid = require('../models/Bid');
  const safeArea = Number(area) || 0;
  if (!safeArea || !projectType) return null;

  // Find similar projects: same type, same governorate, area within ±50%
  const areaMin = safeArea * 0.5;
  const areaMax = safeArea * 1.5;

  let similarProjects = await Project.find({
    projectType,
    'propertyDetails.governorate': governorate,
    'propertyDetails.area': { $gte: areaMin, $lte: areaMax },
    status: { $in: ['awarded', 'closed'] },
    awardedBidId: { $ne: null },
  })
    .select('_id propertyDetails.area awardedBidId')
    .limit(20)
    .lean();

  let scope = 'local';

  if (similarProjects.length === 0) {
    // Broaden: same type, any governorate
    similarProjects = await Project.find({
      projectType,
      status: { $in: ['awarded', 'closed'] },
      awardedBidId: { $ne: null },
    })
      .select('_id propertyDetails.area propertyDetails.governorate awardedBidId')
      .limit(15)
      .lean();
    scope = 'national';
  }

  if (similarProjects.length === 0) return null;

  const bidIds = similarProjects.map(p => p.awardedBidId).filter(Boolean);
  if (bidIds.length === 0) return null;

  const bids = await Bid.find({ _id: { $in: bidIds } }).select('amount').lean();
  if (bids.length === 0) return null;

  const amounts = bids.map(b => b.amount).filter(a => Number.isFinite(a)).sort((a, b) => a - b);
  if (amounts.length === 0) return null;

  return {
    count: amounts.length,
    minPrice: amounts[0],
    maxPrice: amounts[amounts.length - 1],
    avgPrice: Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length),
    scope,
  };
}

// =====================================================
// CONTROLLERS
// =====================================================

// POST /api/projects — customer bs
// query ?draft=1 → ينشئ مسودة بدل مشروع مفتوح
const createProject = asyncHandler(async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');
  }

  const isDraft = req.query.draft === '1' || req.query.draft === 'true';
  const { isPrivate, invitedContractors, isUrgent, isFeatured, ...projectData } = parsed.data;

  const project = await Project.create({
    ...projectData,
    postedBy: req.user._id,
    status: isDraft ? 'draft' : 'open',
    isPrivate: isPrivate || false,
    invitedContractors: isPrivate ? (invitedContractors || []) : [],
    isUrgent: isUrgent || false,
    isFeatured: isFeatured || false,
    featuredUntil: isFeatured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
  });

  res.status(201).json({ project });
});

// GET /api/projects — public, with filters
const listProjects = asyncHandler(async (req, res) => {
  const {
    type, governorate, budget, status = 'open',
    featured, urgent,
    page = 1, limit = 20,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (type) filter.projectType = type;
  if (governorate) filter['propertyDetails.governorate'] = governorate;
  if (budget) filter.budgetRange = budget;
  if (featured === 'true') filter.isFeatured = true;
  if (urgent === 'true') filter.isUrgent = true;

  // hide private projects from public listing
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    filter.isPrivate = { $ne: true };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('postedBy', 'name')
      // featured first, then urgent, then newest
      .sort({ isFeatured: -1, isUrgent: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-requirements')
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

// GET /api/projects/my-projects — user only
const getMyProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ postedBy: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
    
  res.json({ projects });
});

// GET /api/projects/:id — public
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('postedBy', 'name phone')
    .lean();

  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  let canViewContact = false;
  if (req.user) {
    if (req.user.role === 'admin') canViewContact = true;
    if (project.postedBy && project.postedBy._id && project.postedBy._id.toString() === req.user._id.toString()) {
      canViewContact = true;
    }
    if (project.status === 'awarded' && project.awardedTo && project.awardedTo.toString() === req.user._id.toString()) {
      canViewContact = true;
    }
  }

  if (!canViewContact && project.postedBy) {
    delete project.postedBy.phone;
  }

  res.json({ project });
});

// POST /api/projects/:id/ai-estimate OR /api/projects/ai-estimate
const aiEstimate = asyncHandler(async (req, res) => {
  let projectData = req.body;
  let projectModel = null;

  if (req.params.id) {
    projectModel = await Project.findById(req.params.id);
    if (!projectModel) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

    // لازم يكون هو صاحب المشروع
    if (projectModel.postedBy.toString() !== req.user._id.toString()) {
      throw new AppError('غير مصرح', 403, 'FORBIDDEN');
    }

    // منع استدعاء الـ AI أكتر من مرة لو في estimate موجود خلال آخر ساعة
    if (projectModel.aiEstimatedPrice?.estimatedAt) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (projectModel.aiEstimatedPrice.estimatedAt > hourAgo) {
        return res.json({ aiEstimatedPrice: projectModel.aiEstimatedPrice, cached: true });
      }
    }
    projectData = projectModel;
  } else {
    // Validate request body loosely for preview
    if (!projectData.propertyDetails) {
       throw new AppError('بيانات العقار مطلوبة', 400, 'VALIDATION_ERROR');
    }
  }

  // التحقق من توافر المفتاح (Mock fallback)
  if (!isAIAvailable()) {
    const estimate = {
      minEstimate: projectData.propertyDetails.area * 500,
      maxEstimate: projectData.propertyDetails.area * 1200,
      currency: "EGP",
      reasoning: "نظرا لعدم توفر مفتاح AI صالح، هذا تقدير تجريبي.",
      estimatedAt: new Date(),
      model: "mock-sonnet"
    };
    return res.json({ aiEstimatedPrice: estimate });
  }

  // بناء الـ prompt من بيانات الفورم
  const { projectType, propertyDetails, requirements, budgetRange, timeline } = projectData;
  const requirementsText = Object.entries(requirements || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('، ') || 'لم تُحدد';

  const locationText = propertyDetails.district
    ? `${propertyDetails.governorate} - ${propertyDetails.district}`
    : propertyDetails.governorate;

  // Fetch market context from platform data — يحسن دقة التقدير
  let marketSection = '';
  try {
    const ctx = await getMarketContext(projectType, propertyDetails.governorate, propertyDetails.area);
    if (ctx) {
      const scopeLabel = ctx.scope === 'local' ? ' في نفس المحافظة' : ' على مستوى الجمهورية';
      marketSection = `

بيانات من مشاريع مشابهة على المنصة (${ctx.count} مشروع${scopeLabel}):
- أقل سعر عرض مقبول: ${ctx.minPrice.toLocaleString()} جنيه
- أعلى سعر عرض مقبول: ${ctx.maxPrice.toLocaleString()} جنيه
- متوسط الأسعار: ${ctx.avgPrice.toLocaleString()} جنيه
استخدم هذه البيانات كمرجع واقعي لتقديرك.`;
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to get market context for AI estimate');
  }

  const prompt = `أنت خبير تقدير تكاليف مشاريع البناء والتشطيب في مصر. بناءً على المعلومات التفصيلية التالية، قدّم نطاق سعر واقعي ودقيق بالجنيه المصري.

نوع المشروع: ${PROJECT_TYPE_LABELS[projectType] || projectType}
الموقع: ${locationText}
المساحة: ${propertyDetails.area} متر مربع
عدد الطوابق: ${propertyDetails.floors || 1}
عدد الغرف: ${propertyDetails.rooms || 'غير محدد'}
عدد الحمامات: ${propertyDetails.bathrooms || 'غير محدد'}
المتطلبات المحددة: ${requirementsText}
الميزانية المفضلة: ${BUDGET_LABELS[budgetRange] || 'غير محددة'}
الجدول الزمني المطلوب: ${TIMELINE_LABELS[timeline] || 'غير محدد'}
${marketSection}

خذ في الاعتبار أسعار مواد البناء والعمالة الحالية في ${propertyDetails.governorate}. أجب بـ JSON فقط بهذا الشكل، بدون أي نص خارجه:
{"minEstimate": number, "maxEstimate": number, "currency": "EGP", "reasoning": "شرح مختصر باللغة العربية في 2-3 جمل"}`;

  let aiResponse;
  try {
    aiResponse = await callLLM(prompt, {
      maxTokens: 300,
      systemPrompt: 'أنت خبير تقدير تكاليف مشاريع بناء وتشطيب في مصر بخبرة 20 سنة. تعرف أسعار السوق المصري الحالية (2024-2025): الحديد 40,000-45,000 ج/طن، الأسمنت 2,200-2,800 ج/طن، متر التشطيب 3,000-8,000 ج حسب المستوى. تجاوب فقط بـ JSON صالح بدون أي نص إضافي.'
    });
    
    if (!aiResponse) {
      throw new Error('Empty response from AI');
    }
  } catch (err) {
    logger.error({ err: err.message }, 'AI estimate request failed');
    throw new AppError('خدمة التقدير غير متاحة حالياً', 503, 'AI_ERROR');
  }

  // parse الـ JSON من الـ response
  const parsed = parseJsonResponse(aiResponse);
  if (!parsed) {
    logger.warn({ aiResponse }, 'AI returned non-JSON response');
    throw new AppError('خطأ في تقدير السعر، حاول مرة أخرى', 502, 'AI_PARSE_ERROR');
  }

  const estimate = {
    minEstimate: Number(parsed.minEstimate),
    maxEstimate: Number(parsed.maxEstimate),
    currency: 'EGP',
    reasoning: parsed.reasoning || '',
    estimatedAt: new Date(),
    model: 'claude-sonnet-4-6',
  };

  if (projectModel) {
    projectModel.aiEstimatedPrice = estimate;
    await projectModel.save();
  }

  res.json({ aiEstimatedPrice: estimate });
});

// =====================================================
// PATCH /api/projects/:id — customer only (owner)
// يسمح بالتعديل فقط لو المشروع draft أو open بدون عروض
// =====================================================

const updateProjectSchema = z.object({
  title: z.string().trim().min(5).max(120).optional(),
  description: z.string().max(1000).optional(),
  projectType: z.enum([
    'new_construction', 'finishing', 'renovation', 'repair',
    'extension', 'demolition', 'electrical', 'plumbing', 'other',
  ]).optional(),
  propertyDetails: z.object({
    governorate: z.string().min(2).optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    area: z.number().min(10).max(50000).optional(),
    floors: z.number().int().min(1).max(30).optional(),
    rooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    gpsCoords: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).nullable().optional(),
  }).optional(),
  requirements: z.record(z.unknown()).optional(),
  budgetRange: z.enum([
    'under_50k', '50k_200k', '200k_500k', '500k_1m', 'above_1m', 'flexible',
  ]).optional(),
  timeline: z.enum([
    'within_week', 'within_month', '1_3_months', '3_6_months', 'flexible',
  ]).optional(),
  requiredEngineers: z.coerce.number().int().min(0).max(50).optional(),
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  // لازم يكون صاحب المشروع
  if (project.postedBy.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  }

  // التعديل فقط لو draft أو open بدون عروض
  if (project.status === 'awarded' || project.status === 'closed') {
    throw new AppError('لا يمكن تعديل مشروع مُرسى أو مغلق', 400, 'PROJECT_LOCKED');
  }
  if (project.status === 'open' && project.bidsCount > 0) {
    throw new AppError('لا يمكن تعديل مشروع عليه عروض بالفعل', 400, 'HAS_BIDS');
  }

  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');
  }

  // دمج propertyDetails بذكاء (مش نستبدلهم كلهم)
  if (parsed.data.propertyDetails) {
    Object.assign(project.propertyDetails, parsed.data.propertyDetails);
    delete parsed.data.propertyDetails;
  }

  Object.assign(project, parsed.data);
  await project.save();

  res.json({ project });
});

// =====================================================
// DELETE /api/projects/:id — customer only (owner)
// يسمح بالحذف فقط لو المشروع draft أو open بدون عروض
// =====================================================

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  if (project.postedBy.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  }

  if (project.status === 'awarded') {
    throw new AppError('لا يمكن حذف مشروع مُرسى', 400, 'PROJECT_AWARDED');
  }
  if (project.bidsCount > 0) {
    throw new AppError('لا يمكن حذف مشروع عليه عروض', 400, 'HAS_BIDS');
  }

  await project.deleteOne();
  res.json({ ok: true, message: 'تم حذف المشروع بنجاح' });
});

// =====================================================
// POST /api/projects/:id/publish — customer only (owner)
// ينشر مسودة → يحولها لـ open
// =====================================================

const publishDraft = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  if (project.postedBy.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  }

  if (project.status !== 'draft') {
    throw new AppError('المشروع ليس مسودة — لا يمكن نشره', 400, 'NOT_DRAFT');
  }

  project.status = 'open';
  await project.save();

  res.json({ project });
});

// =====================================================
// POST /api/projects/:id/close — customer only (owner)
// يغلق المشروع (awarded → closed) ويسمح بتقييم المقاول
// =====================================================

const closeProjectSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  review: z.string().max(500).optional().default(''),
  closurePhotos: z.object({
    before: z.array(z.object({ filename: z.string(), originalName: z.string() })).optional().default([]),
    after: z.array(z.object({ filename: z.string(), originalName: z.string() })).optional().default([]),
  }).optional(),
});

const closeProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  if (project.postedBy.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  }

  if (project.status !== 'awarded') {
    throw new AppError('لا يمكن إغلاق مشروع غير مُرسى', 400, 'NOT_AWARDED');
  }

  // صور الإغلاق إلزامية — قبل وبعد
  const beforePhotos = req.files?.closureBefore || [];
  const afterPhotos = req.files?.closureAfter || [];
  if (beforePhotos.length === 0 || afterPhotos.length === 0) {
    throw new AppError('يجب رفع صور قبل وبعد الإنجاز لإغلاق المشروع', 400, 'CLOSURE_PHOTOS_REQUIRED');
  }

  const parsed = closeProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');
  }

  const mapPhoto = (f) => ({ filename: f.filename, originalName: f.originalname, mimetype: f.mimetype, size: f.size });

  project.status = 'closed';
  project.closedAt = new Date();
  project.closurePhotos = {
    before: beforePhotos.map(mapPhoto),
    after: afterPhotos.map(mapPhoto),
  };
  if (parsed.data.review) project.clientReview = parsed.data.review;
  if (parsed.data.rating) project.clientRating = parsed.data.rating;
  await project.save();

  // تحديث إحصائيات المقاول + إضافة للبورتفوليو تلقائياً
  if (project.awardedTo) {
    const Contractor = require('../models/ContractorProfile');
    const PortfolioItem = require('../models/PortfolioItem');

    const contractor = await Contractor.findById(project.awardedTo);
    if (contractor) {
      contractor.completedProjects = (contractor.completedProjects || 0) + 1;
      if (parsed.data.rating) {
        const oldTotal = contractor.rating * Math.max(0, contractor.completedProjects - 1);
        contractor.rating = Math.round(((oldTotal + parsed.data.rating) / contractor.completedProjects) * 10) / 10;
      }
      await contractor.save();
    }

    // إضافة صور الإغلاق للبورتفوليو تلقائياً
    await PortfolioItem.create({
      contractor: project.awardedTo,
      sourceProject: project._id,
      title: project.title,
      beforePhotos: beforePhotos.map(mapPhoto),
      afterPhotos: afterPhotos.map(mapPhoto),
      images: [...beforePhotos.map(mapPhoto), ...afterPhotos.map(mapPhoto)],
      isAutoGenerated: true,
    }).catch((err) => logger.warn({ err: err.message }, 'Portfolio auto-create failed (non-fatal)'));
  }

  logger.info({ projectId: project._id.toString() }, 'Project closed with closure photos');
  res.json({ project });
});

// =====================================================
// POST /api/projects/:id/invite — customer only (owner)
// يدعو مقاولاً محدداً لمشروع خاص
// =====================================================

const inviteContractor = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  if (project.postedBy.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  }
  if (!project.isPrivate) {
    throw new AppError('المشروع ليس خاصاً — الدعوة متاحة فقط للمشاريع الخاصة', 400, 'NOT_PRIVATE');
  }

  const { contractorId } = req.body;
  if (!contractorId) throw new AppError('معرف المقاول مطلوب', 400, 'MISSING_CONTRACTOR');

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(contractorId)) {
    throw new AppError('معرف المقاول غير صحيح', 400, 'INVALID_ID');
  }

  const alreadyInvited = project.invitedContractors.some((id) => id.toString() === contractorId);
  if (!alreadyInvited) {
    project.invitedContractors.push(contractorId);
    await project.save();
  }

  logger.info({ projectId: project._id.toString(), contractorId }, 'Contractor invited to private project');
  res.json({ ok: true, invitedContractors: project.invitedContractors });
});

// =====================================================
// PUT /api/projects/:id/feature — admin only
// يضبط isFeatured / isUrgent / featuredUntil
// =====================================================

const featureProjectSchema = z.object({
  isFeatured: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  featuredUntil: z.string().datetime().nullable().optional(),
});

const featureProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  const parsed = featureProjectSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');

  if (parsed.data.isFeatured !== undefined) project.isFeatured = parsed.data.isFeatured;
  if (parsed.data.isUrgent !== undefined) project.isUrgent = parsed.data.isUrgent;
  if (parsed.data.featuredUntil !== undefined) {
    project.featuredUntil = parsed.data.featuredUntil ? new Date(parsed.data.featuredUntil) : null;
  }

  await project.save();

  logger.info({ projectId: project._id.toString(), isFeatured: project.isFeatured, isUrgent: project.isUrgent }, 'Project feature flags updated');
  res.json({ project });
});

// =====================================================
// POST /api/projects/:id/media — customer only (owner)
// رفع صور للمشروع (حد أقصى 20 صورة) — Phase 3.1
// =====================================================

const uploadProjectMedia = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  if (project.postedBy.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  }

  if (!req.files || req.files.length === 0) {
    throw new AppError('لا توجد صور للرفع', 400, 'NO_FILES');
  }

  const MAX_IMAGES = 20;
  const currentCount = (project.photos || []).length;
  if (currentCount + req.files.length > MAX_IMAGES) {
    throw new AppError(
      `الحد الأقصى ${MAX_IMAGES} صورة لكل مشروع. لديك ${currentCount} صورة حالياً.`,
      400, 'MAX_IMAGES_EXCEEDED'
    );
  }

  const newImages = req.files.map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
    uploadedAt: new Date(),
  }));

  if (!project.photos) project.photos = [];
  project.photos.push(...newImages);
  await project.save();

  logger.info({ projectId: project._id.toString(), count: req.files.length }, 'Project media uploaded');
  res.json({ ok: true, images: project.photos, total: project.photos.length });
});

// GET /api/projects/contractors/active — lists all active approved contractors (for invite)
const listActiveContractors = asyncHandler(async (req, res) => {
  const Contractor = require('../models/ContractorProfile');
  const contractors = await Contractor.find({ role: 'contractor', status: 'active' })
    .select('name email phone specialty yearsOfExperience bio rating')
    .lean();
  res.json({ ok: true, contractors });
});

module.exports = { createProject, listProjects, getProject, aiEstimate, updateProject, deleteProject, publishDraft, closeProject, inviteContractor, featureProject, uploadProjectMedia, getMyProjects, listActiveContractors };
