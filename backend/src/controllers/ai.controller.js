// AI Agent controller — project-brief + bid-draft + compare + anomaly + policy chat
const { z } = require('zod');
const {
  callLLM,
  callAnthropicLLM,
  parseJsonResponse,
  askPolicyBot,
} = require('../utils/ai.service');

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

// =====================================================
// AI-AGENT-COMPARE-01 — مقارنة العروض والتوصية
// POST /api/ai/compare-bids
// =====================================================

const Bid = require('../models/Bid');

const compareBids = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) throw new AppError('معرف المشروع مطلوب', 400, 'MISSING_PROJECT');

  const project = await Project.findById(projectId).lean();
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  const bids = await Bid.find({ project: projectId })
    .populate('contractor', 'name specialty rating completedProjects yearsOfExperience')
    .lean();

  if (bids.length < 2) throw new AppError('يجب أن يكون هناك عرضان على الأقل للمقارنة', 400, 'TOO_FEW_BIDS');

  const bidsText = bids.map((b, i) => {
    const c = b.contractor || {};
    return `عرض ${i + 1}: المقاول "${c.name || 'غير معروف'}" — السعر ${b.amount.toLocaleString('ar-EG')} جنيه — المدة ${b.proposedDurationDays || '?'} يوم — التقييم ${c.rating || 0}/5 — مشاريع مكتملة ${c.completedProjects || 0} — الخبرة ${c.yearsOfExperience || 0} سنة — الرسالة: "${b.message}"`;
  }).join('\n');

  const prompt = `أنت خبير مقاولات مصري. قارن بين العروض التالية على مشروع "${project.title}" (${project.projectType}) وقدم توصيتك.

${bidsText}

قيّم كل عرض من حيث: السعر، الخبرة، التقييم، والرسالة. ثم رشّح الأفضل مع الأسباب.

أجب بـ JSON فقط:
{"recommendation":{"bidIndex":0,"reason":"سبب الترشيح"},"comparison":[{"bidIndex":0,"score":85,"pros":["ميزة"],"cons":["عيب"]}]}`;

  try {
    const raw = await callLLM(prompt, {
      maxTokens: 800,
      systemPrompt: 'أنت خبير مقاولات مصري وتجاوب فقط بـ JSON صالح.',
    });

    if (!raw) {
      // Mock: recommend cheapest with best rating
      const sorted = [...bids].sort((a, b) => (a.amount - b.amount) || ((b.contractor?.rating || 0) - (a.contractor?.rating || 0)));
      return res.json({
        recommendation: { bidId: sorted[0]._id, reason: 'أقل سعر مع أفضل تقييم' },
        comparison: bids.map((b, i) => ({ bidId: b._id, score: 70 + Math.random() * 25, pros: ['سعر تنافسي'], cons: ['يحتاج مراجعة'] })),
        mock: true,
      });
    }

    const parsedResult = parseJsonResponse(raw);
    // Map bidIndex to bidId
    if (parsedResult.recommendation && typeof parsedResult.recommendation.bidIndex === 'number') {
      parsedResult.recommendation.bidId = bids[parsedResult.recommendation.bidIndex]?._id;
    }
    if (parsedResult.comparison) {
      parsedResult.comparison = parsedResult.comparison.map((c) => ({
        ...c, bidId: bids[c.bidIndex]?._id,
      }));
    }
    res.json(parsedResult);
  } catch (err) {
    logger.error({ err: err.message }, 'AI compare-bids failed');
    throw new AppError('تعذر مقارنة العروض حالياً', 503, 'AI_ERROR');
  }
});

// =====================================================
// AI-AGENT-ANOMALY-01 — كشف شذوذ التسعير (مُحسَّن)
// POST /api/ai/detect-anomalies
// Auth: عميل فقط ويجب أن يكون مالك المشروع (postedBy)
// =====================================================

const detectAnomalies = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) throw new AppError('معرف المشروع مطلوب', 400, 'MISSING_PROJECT');

  // جلب المشروع والتحقق من الملكية
  const project = await Project.findById(projectId).lean();
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');

  // تحقق أن العميل الحالي هو مالك المشروع — الحقل في الـ Schema هو postedBy
  const ownerId = project.postedBy?.toString();
  if (ownerId && ownerId !== req.user._id.toString()) {
    throw new AppError('غير مصرح — هذا المشروع لا ينتمي إليك', 403, 'FORBIDDEN');
  }

  const bids = await Bid.find({ project: projectId }).lean();
  if (bids.length < 3) throw new AppError('يجب أن يكون هناك 3 عروض على الأقل لكشف الشذوذ', 400, 'TOO_FEW_BIDS');

  // حساب المتوسط والانحراف المعياري
  const amounts = bids.map((b) => b.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stddev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);

  // حساب Z-Score لكل عرض وتحديد نوع الشذوذ (|z| > 1.5)
  const Z_THRESHOLD = 1.5;
  const enrichedBids = bids.map((b) => {
    const zScore = stddev > 0 ? (b.amount - mean) / stddev : 0;
    const isAnomaly = Math.abs(zScore) > Z_THRESHOLD;
    const anomalyType = !isAnomaly ? 'normal' : zScore < 0 ? 'low' : 'high';

    return {
      bidId: b._id,
      amount: b.amount,
      zScore: Math.round(zScore * 100) / 100,
      anomalyFlag: isAnomaly,
      anomalyType,
      deviationPercent: Math.round(((b.amount - mean) / mean) * 100),
      llmComment: null, // سيُملأ من الـ LLM
    };
  });

  // نطلب من الـ LLM تعليقاً نوعياً على العروض الشاذة فقط
  const anomalousEntries = enrichedBids.filter((b) => b.anomalyFlag);

  if (anomalousEntries.length > 0) {
    try {
      const anomalyDescriptions = anomalousEntries.map((b) =>
        `عرض بمبلغ ${b.amount.toLocaleString('ar-EG')} جنيه (z-score: ${b.zScore}، نوع: ${b.anomalyType === 'low' ? 'منخفض' : 'مرتفع'})`
      ).join('\n');

      const llmPrompt = `أنت خبير تقييم عطاءات مقاولات مصري. المتوسط العام للعروض هو ${Math.round(mean).toLocaleString('ar-EG')} جنيه.

العروض الشاذة التالية تحتاج تعليقاً نوعياً مختصراً (جملة واحدة لكل منها):
${anomalyDescriptions}

أجب بـ JSON فقط — مصفوفة بنفس ترتيب العروض:
[{"comment": "تعليق نوعي مختصر"}, ...]`;

      logger.info({ anomalousCount: anomalousEntries.length, mean: Math.round(mean) }, 'Anomaly LLM assessment requested');

      const llmRaw = await callAnthropicLLM(llmPrompt, {
        model: 'claude-sonnet-4-6',
        maxTokens: 300,
        temperature: 0.3,
        systemPrompt: 'أنت خبير تقييم عطاءات وتجاوب فقط بـ JSON صالح بدون أي نص إضافي.',
      });

      if (llmRaw) {
        let comments;
        try {
          // يمكن أن يكون JSON داخل array brackets
          const cleanRaw = llmRaw.replace(/```json?\s*\n?/gi, '').replace(/```\s*/g, '').trim();
          const arrStart = cleanRaw.indexOf('[');
          const arrEnd = cleanRaw.lastIndexOf(']');
          if (arrStart !== -1 && arrEnd !== -1) {
            comments = JSON.parse(cleanRaw.substring(arrStart, arrEnd + 1));
          }
        } catch (parseErr) {
          logger.warn({ err: parseErr.message }, 'Failed to parse LLM comments array');
        }

        if (Array.isArray(comments)) {
          anomalousEntries.forEach((bid, idx) => {
            if (comments[idx]?.comment) {
              bid.llmComment = comments[idx].comment;
            }
          });
        }
      }
    } catch (llmErr) {
      // الـ LLM اختياري — نكمل بدونه
      logger.warn({ err: llmErr.message }, 'Anomaly LLM assessment failed — continuing without comments');
    }

    // تعليق افتراضي للعروض الشاذة التي لم تحصل على تعليق LLM
    enrichedBids.forEach((b) => {
      if (b.anomalyFlag && !b.llmComment) {
        b.llmComment = b.anomalyType === 'low'
          ? 'هذا العرض منخفض بشكل مريب مقارنة بمتوسط العروض — قد يشير إلى جودة منخفضة أو تكاليف مخفية.'
          : 'هذا العرض مرتفع بشكل مريب مقارنة بمتوسط العروض — تأكد من مبرراته.';
      }
    });
  }

  const anomalyCount = enrichedBids.filter((b) => b.anomalyFlag).length;

  res.json({
    stats: {
      mean: Math.round(mean),
      stddev: Math.round(stddev),
      totalBids: bids.length,
      anomalyCount,
      budget: project.budget || null,
    },
    bids: enrichedBids,
    hasAnomalies: anomalyCount > 0,
  });
});

// =====================================================
// AI-AGENT-CHAT-01 — شات بوت سياسات المنصة (RAG-lite)
// POST /api/ai/chat
// =====================================================

const PLATFORM_KNOWLEDGE = `
سياسات منصة المقاول (El-Moquwal):
- المنصة تربط بين أصحاب العقارات والمقاولين في مصر.
- التسجيل مجاني لجميع المستخدمين. المقاولين يحتاجون موافقة الإدارة.
- نظام العروض العمياء: المقاول لا يرى عروض المنافسين.
- المقاول يحصل على 5 نقاط مجانية عند التسجيل. كل عرض يكلف 1 نقطة (5 نقاط للمشاريع فوق مليون).
- يمكن شراء نقاط إضافية عبر المنصة.
- عمولة المنصة 2% من قيمة المشروع عند الإرساء (قابلة للتعديل من الإدارة).
- نظام Escrow: أموال العميل تُحجز وتُصرف على مراحل (30% بداية، 40% منتصف، 30% تسليم).
- الضمان: سقف تعويض 10% من قيمة المشروع بحد أقصى 50,000 جنيه.
- اشتراك Premium: 199 جنيه/شهر مع 10 نقاط مجانية و badge مميز.
- العقد الإلكتروني يُولّد تلقائياً بعد قبول العرض ويتطلب توقيع الطرفين.
- المقاول ملزم برفع صور (قبل/بعد) عند إغلاق المشروع.
- برنامج الإحالة: نقطتان مكافأة لكل صديق يسجل بكودك.
`;

const chatbot = asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  if (!message) throw new AppError('الرسالة مطلوبة', 400, 'MISSING_MESSAGE');

  const chatHistory = (history || []).slice(-6); // آخر 6 رسائل فقط
  const prompt = `أنت مساعد ذكي لمنصة المقاول. استخدم المعلومات التالية للإجابة على سؤال المستخدم:

${PLATFORM_KNOWLEDGE}

محادثة سابقة:
${chatHistory.map((m) => `${m.role === 'user' ? 'المستخدم' : 'المساعد'}: ${m.content}`).join('\n')}

سؤال المستخدم الحالي: ${message}

أجب بإيجاز ووضوح بالعربية. لو السؤال خارج نطاق المنصة، وجّه المستخدم بلطف.`;

  try {
    const raw = await callLLM(prompt, {
      maxTokens: 400,
      systemPrompt: 'أنت مساعد ذكي لمنصة المقاول. أجب بالعربية بشكل مختصر وودود.',
    });

    if (!raw) {
      return res.json({
        reply: 'أهلاً بك! أنا مساعد منصة المقاول. يمكنني مساعدتك في أي استفسار عن سياسات المنصة، التسجيل، النقاط، العقود، أو أي موضوع آخر. اسألني!',
        mock: true,
      });
    }

    res.json({ reply: raw });
  } catch (err) {
    logger.error({ err: err.message }, 'AI chatbot failed');
    res.json({ reply: 'عذراً، لم أتمكن من معالجة سؤالك حالياً. حاول مرة أخرى أو تواصل مع الدعم.' });
  }
});

// =====================================================
// AI-POLICY-RAG-01 — بوت سياسات المنصة (RAG بالأنثروبيك)
// POST /api/ai/policy-chat
// Auth: اختياري (مسموح للزوار والمسجلين)
// Rate limit: 20 طلب/ساعة لكل IP
// =====================================================

const policyChatSchema = z.object({
  question: z.string().min(3, 'السؤال قصير جداً').max(500, 'السؤال طويل جداً'),
});

const policyChat = asyncHandler(async (req, res) => {
  const parsed = policyChatSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0]?.message || 'بيانات غير صحيحة', 400, 'VALIDATION_ERROR');
  }

  const { question } = parsed.data;

  logger.info(
    { question: question.slice(0, 80), userId: req.user?._id || 'guest' },
    'Policy chat request'
  );

  try {
    const result = await askPolicyBot(question);
    return res.json({
      answer: result.answer,
      relatedPolicies: result.relatedPolicies,
      ...(result.mock ? { mock: true } : {}),
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Policy chat failed');
    throw new AppError('تعذر معالجة سؤالك حالياً، حاول مرة أخرى لاحقاً', 503, 'AI_ERROR');
  }
});

// =====================================================
// AI-AGENT-ESTIMATE-01 — تقدير سعر المشروع + وصف احترافي (مجمّع)
// POST /api/ai/estimate-project
// Auth: customer فقط
// Phase 3.2 — Accept raw description + project params, return structured JSON
// =====================================================

const estimateProjectSchema = z.object({
  rawDescription: z.string().min(5).max(2000).optional().default(''),
  projectType: z.enum([
    'new_construction', 'finishing', 'renovation', 'repair',
    'extension', 'demolition', 'electrical', 'plumbing', 'other',
  ]).optional().default('other'),
  governorate: z.string().optional().default('القاهرة'),
  area: z.coerce.number().min(10).max(50000).optional().default(100),
  floors: z.coerce.number().int().min(1).max(30).optional().default(1),
  rooms: z.coerce.number().int().min(0).optional().default(0),
  bathrooms: z.coerce.number().int().min(0).optional().default(0),
  budgetRange: z.string().optional().default(''),
  timeline: z.string().optional().default(''),
  requirements: z.string().optional().default(''),
});

const TYPE_LABELS_EST = {
  new_construction: 'بناء جديد', finishing: 'تشطيبات', renovation: 'تجديد',
  repair: 'إصلاح', extension: 'توسعة', demolition: 'هدم',
  electrical: 'أعمال كهربائية', plumbing: 'أعمال سباكة', other: 'أخرى',
};

const estimateProject = asyncHandler(async (req, res) => {
  const parsed = estimateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('بيانات غير صحيحة', 400, 'VALIDATION_ERROR');
  }

  const {
    rawDescription, projectType, governorate, area,
    floors, rooms, bathrooms, budgetRange, timeline, requirements,
  } = parsed.data;

  const typeLabel = TYPE_LABELS_EST[projectType] || 'أخرى';

  const prompt = `أنت خبير مقاولات ومصمم عقارات في مصر. لديك مهمتان:

المهمة الأولى — تحسين الوصف:
وصف العميل الخام: "${rawDescription || 'لا يوجد وصف'}"
نوع المشروع: ${typeLabel}
الموقع: ${governorate}
المساحة: ${area} م²، الأدوار: ${floors}، الغرف: ${rooms}، الحمامات: ${bathrooms}
${budgetRange ? 'الميزانية المفضلة: ' + budgetRange : ''}
${requirements ? 'متطلبات إضافية: ' + requirements : ''}

المهمة الثانية — تقدير التكلفة:
قدّر تكلفة التنفيذ الواقعية بالجنيه المصري للعام الحالي آخذاً في الاعتبار أسعار العمالة والمواد في ${governorate}.

أجب بـ JSON فقط بدون أي نص خارجه:
{
  "title": "عنوان مقترح للمشروع (5-10 كلمات)",
  "description": "وصف احترافي منظم (100-200 كلمة)",
  "requirements": ["متطلب 1", "متطلب 2", "متطلب 3"],
  "missingInfo": ["معلومة ناقصة 1"],
  "minEstimate": <رقم أدنى بالجنيه>,
  "maxEstimate": <رقم أقصى بالجنيه>,
  "currency": "EGP",
  "reasoning": "شرح مختصر للتقدير في 2 جمل"
}`;

  try {
    const raw = await callLLM(prompt, {
      maxTokens: 700,
      systemPrompt: 'أنت خبير مقاولات مصري. أجب فقط بـ JSON صالح بدون أي نص إضافي.',
    });

    if (!raw) {
      // Mock fallback
      const mockMin = area * 600;
      const mockMax = area * 1400;
      return res.json({
        title: `مشروع ${typeLabel} — ${governorate}`,
        description: rawDescription || `مشروع ${typeLabel} بمساحة ${area} م² في ${governorate}.`,
        requirements: ['يرجى تحديد المتطلبات التفصيلية'],
        missingInfo: ['المساحة الدقيقة', 'مواصفات التشطيب'],
        minEstimate: mockMin,
        maxEstimate: mockMax,
        currency: 'EGP',
        reasoning: 'تقدير تجريبي بناءً على متوسطات السوق.',
        source: 'ai_assistant',
        mock: true,
      });
    }

    const result = parseJsonResponse(raw);
    result.source = 'ai_assistant';
    res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'AI estimate-project failed');
    throw new AppError('تعذر إنشاء التقدير حالياً', 503, 'AI_ERROR');
  }
});

module.exports = { projectBrief, bidDraft, compareBids, detectAnomalies, chatbot, policyChat, estimateProject };
