// خدمة الذكاء الاصطناعي — Hugging Face Inference API + Anthropic API
// بتستخدم Chat Completions API عشان تشتغل مع أي موديل instruction-tuned

const env = require('../config/env');
const logger = require('./logger');

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';

/**
 * يستدعي Pollinations AI (بديل مجاني متوافق مع OpenAI API ولا يحتاج مفتاح)
 */
async function callLLM(prompt, options = {}) {
  const { maxTokens = 800, temperature = 0.7, systemPrompt } = options;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai', // uses the best available OpenAI compatible model
        messages: messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown');
      logger.error({ status: response.status, body: errorText }, 'Pollinations API error');
      throw new Error(`Pollinations API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    }
    
    logger.warn({ data }, 'Unexpected Pollinations response shape');
    return null;
  } catch (error) {
    logger.error({ err: error.message }, 'callLLM error (Pollinations)');
    return null;
  }
}

/**
 * يستدعي Anthropic API مباشرةً (claude-haiku أو claude-sonnet)
 * بيرجع نص الرد أو null لو الـ key مش متاح
 */
async function callAnthropicLLM(userMessage, options = {}) {
  const {
    maxTokens = 600,
    temperature = 0.7,
    systemPrompt = '',
    model = 'claude-haiku-4-5-20251001',
  } = options;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('YOUR_') || apiKey.length < 10) {
    logger.warn('ANTHROPIC_API_KEY not configured — returning null');
    return null;
  }

  const body = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: userMessage }],
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown');
    logger.error({ status: response.status, body: errorText }, 'Anthropic API error');
    throw new Error(`Anthropic API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) {
    logger.warn({ data }, 'Unexpected Anthropic response shape');
    return null;
  }
  return text.trim();
}

// =====================================================
// قاعدة بيانات سياسات المنصة — Policy RAG Knowledge Base
// =====================================================

const PLATFORM_POLICIES = {
  escrow: 'نظام الضمان: يتم إيداع مبلغ المشروع في حساب ضمان آمن عند بدء التنفيذ. لا يُطلق المبلغ للمقاول إلا بعد موافقة العميل على اكتمال كل مرحلة. في حالة النزاعات، تتدخل إدارة المنصة للفصل خلال 5 أيام عمل.',
  commission: 'العمولة: المنصة تخصم 2% من قيمة المشروع كعمولة على الصفقات المكتملة. العملاء لا يدفعون أي رسوم للتسجيل أو نشر المشاريع.',
  contracts: 'العقود: كل مشروع يُنتج عقداً إلكترونياً موثقاً بتوقيع رقمي من الطرفين. العقد يتضمن قيمة المشروع، المراحل، والمدة الزمنية.',
  warranty: 'الضمان: المنصة توفر ضماناً يصل إلى 10% من قيمة المشروع (بحد أقصى 50,000 جنيه) في حالة إخلال المقاول بالعقد.',
  dispute: 'النزاعات: في حالة الخلاف بين العميل والمقاول، يمكن فتح تذكرة نزاع. الإدارة تراجع الوضع خلال 5 أيام عمل وتصدر حكماً ملزماً.',
  contractors: 'المقاولون: كل مقاول يمر بمراجعة هوية وتحقق وثائقي قبل القبول. المقاول المعلق يمكنه تقديم عروض بعد الموافقة الإدارية.',
  credits: 'النقاط: المقاولون يستخدمون نقاط لتقديم العروض. كل عرض يكلف 1-2 نقطة حسب حجم المشروع. يمكن شراء حزم نقاط.',
  subscriptions: 'الاشتراكات: المقاولون يمكنهم الاشتراك في خطط مميزة للحصول على مزايا إضافية مثل ظهور أولوي في نتائج البحث.',
  privacy: 'الخصوصية: نحن لا نشارك بياناتك الشخصية مع أي طرف ثالث. الرقم القومي يُخزن مشفراً ولا يظهر للمستخدمين الآخرين.',
  refund: 'الاسترداد: في حالة إلغاء المشروع قبل البدء، يُسترد كامل المبلغ خلال 3-5 أيام عمل. بعد البدء، يتم التسوية حسب نسبة الإنجاز.',
};

// الكلمات المفتاحية لكل قسم — بالعربي والإنجليزي
const POLICY_KEYWORDS = {
  escrow: ['ضمان', 'escrow', 'أمانة', 'حجز', 'المبلغ', 'إيداع', 'دفع', 'مراحل', 'دفعة'],
  commission: ['عمولة', 'commission', 'رسوم', 'نسبة', 'خصم', '2%', 'رسم', 'اشتراك مجاني', 'تسجيل مجاني'],
  contracts: ['عقد', 'contract', 'توقيع', 'إلكتروني', 'اتفاقية', 'وثيقة', 'بنود'],
  warranty: ['ضمان', 'warranty', 'تعويض', 'إخلال', 'مخالفة', '50000', 'تأمين'],
  dispute: ['نزاع', 'dispute', 'خلاف', 'مشكلة', 'شكوى', 'تذكرة', 'حكم', 'فصل'],
  contractors: ['مقاول', 'contractor', 'تسجيل', 'قبول', 'موافقة', 'هوية', 'وثائق', 'معلق', 'مراجعة'],
  credits: ['نقاط', 'credits', 'points', 'رصيد', 'عرض', 'تكلفة', 'حزمة', 'شراء'],
  subscriptions: ['اشتراك', 'subscription', 'premium', 'مميز', 'خطة', 'مزايا', 'أولوية'],
  privacy: ['خصوصية', 'privacy', 'بيانات', 'شخصية', 'رقم قومي', 'تشفير', 'سرية'],
  refund: ['استرداد', 'refund', 'إلغاء', 'إرجاع', 'مبلغ', 'تسوية', 'إنجاز'],
};

/**
 * يجد أكثر أقسام السياسات ارتباطاً بسؤال المستخدم
 * بيرجع مصفوفة من مفاتيح الأقسام مرتبة تنازلياً حسب التطابق
 */
function findRelevantPolicies(question, topN = 3) {
  const q = question.toLowerCase();
  const scores = Object.entries(POLICY_KEYWORDS).map(([key, keywords]) => {
    const score = keywords.reduce((acc, kw) => acc + (q.includes(kw.toLowerCase()) ? 1 : 0), 0);
    return { key, score };
  });

  return scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((s) => s.key);
}

/**
 * Policy RAG Bot — يجيب على أسئلة المستخدم بناءً على سياسات المنصة
 * بيستخدم Hugging Face (Qwen2.5-72B-Instruct) بدلاً من Anthropic
 * بيرجع { answer: string, relatedPolicies: string[] }
 */
async function askPolicyBot(userQuestion) {
  // 1. ابحث عن الأقسام الأكثر صلة
  const relevantKeys = findRelevantPolicies(userQuestion, 3);

  // 2. لو مفيش تطابق، جيب أول 2 أقسام كـ fallback عام
  const keysToUse = relevantKeys.length > 0 ? relevantKeys : ['escrow', 'commission'];

  const contextBlocks = keysToUse.map((k) => PLATFORM_POLICIES[k]).join('\n\n');

  // System prompt محسَّن لـ Qwen — لا يبدأ بمقدمات
  const systemPrompt = `أنت مساعد خدمة عملاء ودود لمنصة "المقاول" — منصة مقاولات مصرية احترافية.
مهمتك: الإجابة على أسئلة المستخدمين بشكل طبيعي ومفيد وودود.
قواعد:
- أجب بالعربية فقط دون أي مقدمة مثل "بالطبع" أو "بكل سرور"
- إذا كان السؤال متعلقاً بالمنصة أو البناء أو المقاولات أو الأسعار، أجب من السياسات المتاحة بشكل مفيد
- إذا لم تجد معلومة محددة في السياسات، اعطِ إجابة عامة مفيدة ومنطقية بدلاً من الرفض
- رفض الإجابة يكون فقط للمواضيع الحساسة أو غير الأخلاقية تماماً — لا تقل "خارج نطاق المنصة" للأسئلة العادية
- الرد لا يتجاوز 4 جمل واضحة ومباشرة`;

  // Prompt مُهيكَل لإجابة مباشرة
  const userMessage = `سياسات المنصة ذات الصلة بالسؤال:
${contextBlocks}

سؤال المستخدم: ${userQuestion}

الإجابة المباشرة:`;

  logger.info({ questionLength: userQuestion.length, relevantKeys: keysToUse }, 'Policy RAG bot invoked (HF)');

  try {
    const answer = await callLLM(userMessage, {
      maxTokens: 400,
      temperature: 0.3,
      systemPrompt,
    });

    if (!answer) {
      // Fallback: إجابة نصية مباشرة من قاعدة البيانات
      const fallbackText = keysToUse.map((k) => PLATFORM_POLICIES[k]).join(' | ');
      return {
        answer: `بناءً على سياسات المنصة: ${fallbackText}`,
        relatedPolicies: keysToUse,
        mock: true,
      };
    }

    // نظّف أي مقدمات متبقية من الموديل
    const cleanAnswer = answer
      .replace(/^(بالطبع[،,]?\s*|بكل سرور[،,]?\s*|حسناً[،,]?\s*|الإجابة[:\s]*)/i, '')
      .trim();

    return { answer: cleanAnswer, relatedPolicies: keysToUse };
  } catch (err) {
    logger.error({ err: err.message }, 'askPolicyBot LLM call failed');
    throw err;
  }
}

/**
 * يحاول يعمل parse لـ JSON من استجابة الـ LLM
 * بيشيل أي code fences أو نص مقدمة قبل الـ JSON
 * مُحسَّن لـ Qwen2.5 اللي بيحط أحياناً نص عربي قبل الـ JSON
 */
function parseJsonResponse(raw) {
  if (!raw) return null;

  // 1. شيل markdown code fences
  let clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // 2. حدد أول { أو [ في النص
  const objIdx = clean.indexOf('{');
  const arrIdx = clean.indexOf('[');

  let startIdx = -1;
  let endChar = '';

  if (objIdx === -1 && arrIdx === -1) {
    // مفيش JSON خالص — جرب parse مباشر (هيطير error لو فاشل)
    return JSON.parse(clean);
  } else if (objIdx === -1) {
    startIdx = arrIdx;
    endChar = ']';
  } else if (arrIdx === -1) {
    startIdx = objIdx;
    endChar = '}';
  } else {
    // الأقرب للبداية يفوز
    if (objIdx < arrIdx) { startIdx = objIdx; endChar = '}'; }
    else                  { startIdx = arrIdx; endChar = ']'; }
  }

  const endIdx = clean.lastIndexOf(endChar);
  if (startIdx !== -1 && endIdx > startIdx) {
    const candidate = clean.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // تابع للـ fallback
    }
  }

  // 3. آخر محاولة — parse النص كاملاً
  return JSON.parse(clean);
}

/**
 * بيتأكد إن الـ AI متاح (عنده مفتاح صالح)
 */
function isAIAvailable() {
  const token = env.HF_API_TOKEN;
  return token && !token.includes('YOUR_') && token.length >= 10;
}

/**
 * بيتأكد إن Anthropic API متاح
 */
function isAnthropicAvailable() {
  const key = env.ANTHROPIC_API_KEY;
  return key && !key.includes('YOUR_') && key.length >= 10;
}

module.exports = {
  callLLM,
  callAnthropicLLM,
  parseJsonResponse,
  isAIAvailable,
  isAnthropicAvailable,
  askPolicyBot,
  PLATFORM_POLICIES,
};
