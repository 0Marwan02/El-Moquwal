// AI Agent controller — project-brief + bid-draft
const { z } = require('zod');
const { callLLM, parseJsonResponse } = require('../utils/ai.service');

const Project = require('../models/Project');
const env = require('../config/env');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// =====================================================
// AI-AGENT-BRIEF-01 — تنظيم وصف مشروع
// POST /api/ai/project-brief
// =====================================================

const briefSchema = z.object({
  rawDescription: z.string().min(10, 'الوصف قصير جداً').max(2000),
  projectType: z.string().optional().default(''),
  governorate: z.string().optional().default(''),
});

const projectBrief = asyncHandler(async (req, res) => {
  const parsed = briefSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');
  }

  const { rawDescription, projectType, governorate } = parsed.data;

  const prompt = `أنت مساعد ذكي لمنصة مقاولات مصرية. العميل كتب وصف مشروع بشكل عشوائي وأنت محتاج تنظمه وتحسّنه.

الوصف الخام: "${rawDescription}"
${projectType ? `نوع المشروع: ${projectType}` : ''}
${governorate ? `المحافظة: ${governorate}` : ''}

المطلوب:
1. أعد كتابة الوصف بشكل احترافي ومنظم بالعربية
2. استخرج المتطلبات الرئيسية كقائمة
3. اقترح عنوان مناسب للمشروع (5-10 كلمات)
4. حدد أي معلومات ناقصة يجب على العميل إضافتها

أجب بـ JSON فقط بهذا الشكل:
{"title": "عنوان مقترح", "description": "وصف منظم واحترافي", "requirements": ["متطلب 1", "متطلب 2"], "missingInfo": ["معلومة ناقصة 1"], "source": "ai_assistant"}`;

  try {
    const raw = await callLLM(prompt, {
      maxTokens: 600,
      systemPrompt: 'أنت مساعد ذكي لمنصة مقاولات وتجاوب فقط بـ JSON صالح بدون أي نص إضافي.',
    });
    if (!raw) {
      // Mock mode
      return res.json({
        brief: {
          title: 'مشروع ' + (projectType || 'تشطيبات') + ' — ' + (governorate || 'القاهرة'),
          description: rawDescription,
          requirements: ['يرجى تحديد المتطلبات بالتفصيل'],
          missingInfo: ['المساحة', 'عدد الأدوار', 'الميزانية المتوقعة'],
          source: 'ai_assistant',
        },
        mock: true,
      });
    }

    const brief = parseJsonResponse(raw);
    brief.source = 'ai_assistant';
    res.json({ brief });
  } catch (err) {
    logger.error({ err: err.message }, 'AI project-brief failed');
    throw new AppError('تعذر تنظيم الوصف حالياً', 503, 'AI_ERROR');
  }
});

// =====================================================
// AI-AGENT-BID-DRAFT-01 — مسودة عرض
// POST /api/ai/bid-draft
// =====================================================

const bidDraftSchema = z.object({
  projectId: z.string().min(1),
  contractorNotes: z.string().max(1000).optional().default(''),
});

const bidDraft = asyncHandler(async (req, res) => {
  const parsed = bidDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');
  }

  const project = await Project.findById(parsed.data.projectId).lean();
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  const TYPE_LABELS = {
    new_construction: 'بناء جديد', finishing: 'تشطيبات', renovation: 'تجديد',
    repair: 'إصلاح', extension: 'توسعة', demolition: 'هدم',
    electrical: 'أعمال كهربائية', plumbing: 'أعمال سباكة', other: 'أخرى',
  };

  const requirements = Object.entries(project.requirements || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('، ') || 'غير محددة';

  const prompt = `أنت مساعد ذكي لمقاول في منصة مقاولات مصرية. ساعده في كتابة رسالة عرض احترافية ومقنعة لهذا المشروع.

بيانات المشروع:
- العنوان: ${project.title}
- النوع: ${TYPE_LABELS[project.projectType] || project.projectType}
- الموقع: ${project.propertyDetails?.governorate || 'غير محدد'}${project.propertyDetails?.district ? ' - ' + project.propertyDetails.district : ''}
- المساحة: ${project.propertyDetails?.area || '؟'} م²
- الأدوار: ${project.propertyDetails?.floors || '؟'}
- المتطلبات: ${requirements}
- الميزانية: ${project.budgetRange || 'غير محددة'}
- الوصف: ${project.description || 'لا يوجد'}

${parsed.data.contractorNotes ? `ملاحظات المقاول: ${parsed.data.contractorNotes}` : ''}

اكتب رسالة عرض احترافية بالعربية (30-100 كلمة) تتضمن:
1. تحية مهنية
2. إشارة لخبرة المقاول في هذا النوع
3. نقاط قوة العرض
4. التزام بالجودة والمواعيد

أجب بـ JSON فقط:
{"message": "نص رسالة العرض", "suggestedDurationDays": number, "tips": ["نصيحة 1"], "source": "ai_assistant"}`;

  try {
    const raw = await callLLM(prompt, {
      maxTokens: 500,
      systemPrompt: 'أنت مساعد ذكي للمقاولين وتجاوب فقط بـ JSON صالح بدون أي نص إضافي.',
    });
    if (!raw) {
      return res.json({
        draft: {
          message: `السلام عليكم، بعد مراجعة تفاصيل مشروعكم (${project.title}) أود التقدم بعرضي. لدي خبرة في ${TYPE_LABELS[project.projectType] || 'هذا المجال'} وأضمن التنفيذ بأعلى جودة والتسليم في الموعد المحدد. أرحب بمناقشة التفاصيل.`,
          suggestedDurationDays: 30,
          tips: ['أضف تفاصيل عن مشاريع سابقة مشابهة', 'حدد سعراً تنافسياً'],
          source: 'ai_assistant',
        },
        mock: true,
      });
    }

    const draft = parseJsonResponse(raw);
    draft.source = 'ai_assistant';
    res.json({ draft });
  } catch (err) {
    logger.error({ err: err.message }, 'AI bid-draft failed');
    throw new AppError('تعذر إنشاء مسودة العرض حالياً', 503, 'AI_ERROR');
  }
});

module.exports = { projectBrief, bidDraft };
