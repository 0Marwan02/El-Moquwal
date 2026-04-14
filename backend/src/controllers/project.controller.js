// el controller bta3 el projects — CRUD + AI estimate
const { z } = require('zod');
const Anthropic = require('@anthropic-ai/sdk');

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
  }),
  requirements: z.record(z.unknown()).optional().default({}),
  budgetRange: z.enum([
    'under_50k', '50k_200k', '200k_500k', '500k_1m', 'above_1m', 'flexible',
  ]).optional(),
  timeline: z.enum([
    'within_week', 'within_month', '1_3_months', '3_6_months', 'flexible',
  ]).optional(),
  requiredEngineers: z.coerce.number().int().min(1).max(50).optional().default(1),
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
// CONTROLLERS
// =====================================================

// POST /api/projects — customer bs
const createProject = asyncHandler(async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');
  }

  const project = await Project.create({
    ...parsed.data,
    postedBy: req.user._id,
    status: 'open',
  });

  res.status(201).json({ project });
});

// GET /api/projects — public, with filters
const listProjects = asyncHandler(async (req, res) => {
  const {
    type, governorate, budget, status = 'open',
    page = 1, limit = 20,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (type) filter.projectType = type;
  if (governorate) filter['propertyDetails.governorate'] = governorate;
  if (budget) filter.budgetRange = budget;

  const skip = (Number(page) - 1) * Number(limit);

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-requirements') // requirements el detail يجي في GET :id
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

  if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY.includes('YOUR_API_KEY')) {
    // For dummy implementation returns mock data
    return res.json({ aiEstimatedPrice: { minEstimate: 50000, maxEstimate: 120000, currency: "EGP", reasoning: "نظرا لعدم توفر مفتاح AI صالح، هذا تقدير تجريبي.", estimatedAt: new Date(), model: "mock-sonnet" }});
  }

  // بناء الـ prompt من بيانات الفورم
  const { projectType, propertyDetails, requirements, budgetRange, timeline } = projectData;
  const requirementsText = Object.entries(requirements || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('، ') || 'لم تُحدد';

  const prompt = `أنت خبير تقدير تكاليف مشاريع البناء والتشطيب في مصر. بناءً على المعلومات التالية، قدّم نطاق سعر واقعي بالجنيه المصري.

نوع المشروع: ${PROJECT_TYPE_LABELS[projectType] || projectType}
المحافظة: ${propertyDetails.governorate}
المساحة: ${propertyDetails.area} متر مربع
عدد الطوابق: ${propertyDetails.floors}
عدد الغرف: ${propertyDetails.rooms}
عدد الحمامات: ${propertyDetails.bathrooms}
المتطلبات: ${requirementsText}
الميزانية المفضلة: ${BUDGET_LABELS[budgetRange] || 'غير محددة'}
الجدول الزمني: ${TIMELINE_LABELS[timeline] || 'غير محدد'}

أجب بـ JSON فقط بهذا الشكل، بدون أي نص خارجه:
{"minEstimate": number, "maxEstimate": number, "currency": "EGP", "reasoning": "شرح مختصر باللغة العربية"}`;

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let aiResponse;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    aiResponse = message.content[0].text.trim();
  } catch (err) {
    logger.error({ err: err.message }, 'AI estimate request failed');
    throw new AppError('خدمة التقدير غير متاحة حالياً', 503, 'AI_ERROR');
  }

  // parse الـ JSON من الـ response — شيل أي code fences لو موجودة
  let parsed;
  try {
    const clean = aiResponse.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
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

module.exports = { createProject, listProjects, getProject, aiEstimate };
