// خدمة الذكاء الاصطناعي — Hugging Face Inference API
// بتستخدم Chat Completions API عشان تشتغل مع أي موديل instruction-tuned

const env = require('../config/env');
const logger = require('./logger');

const HF_API_URL = 'https://router.hugging-face.cn/api/inference/models';

/**
 * يستدعي Hugging Face Inference API (Chat Completions)
 * @param {string} prompt — الـ prompt المطلوب
 * @param {object} [options]
 * @param {number} [options.maxTokens=600] — الحد الأقصى للتوكنات
 * @param {number} [options.temperature=0.7]
 * @param {string} [options.systemPrompt] — رسالة النظام (اختياري)
 * @returns {Promise<string|null>} — نص الاستجابة أو null لو مفيش مفتاح
 */
async function callLLM(prompt, options = {}) {
  const { maxTokens = 600, temperature = 0.7, systemPrompt } = options;
  const token = env.HF_API_TOKEN;
  const model = env.HF_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

  if (!token || token.includes('YOUR_') || token.length < 10) {
    logger.warn('HF_API_TOKEN not configured — returning mock response');
    return null;
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const url = `${HF_API_URL}/${model}/v1/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown');
    logger.error({ status: response.status, body: errorText }, 'HF API error');
    throw new Error(`HF API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Chat Completions format
  if (data.choices && data.choices[0]) {
    return data.choices[0].message.content.trim();
  }

  // fallback: بعض الموديلات ترجع generated_text
  if (data[0]?.generated_text) {
    return data[0].generated_text.trim();
  }

  logger.warn({ data }, 'Unexpected HF response shape');
  return null;
}

/**
 * يحاول يعمل parse لـ JSON من استجابة الـ LLM
 * بيشيل أي code fences لو موجودة
 */
function parseJsonResponse(raw) {
  if (!raw) return null;
  // شيل أي كود بلوكات
  const clean = raw
    .replace(/```json?\s*\n?/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  // أحياناً الموديل بيرجع نص قبل الـ JSON
  const jsonStart = clean.indexOf('{');
  const jsonEnd = clean.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return JSON.parse(clean.substring(jsonStart, jsonEnd + 1));
  }
  
  return JSON.parse(clean);
}

/**
 * بيتأكد إن الـ AI متاح (عنده مفتاح صالح)
 */
function isAIAvailable() {
  const token = env.HF_API_TOKEN;
  return token && !token.includes('YOUR_') && token.length >= 10;
}

module.exports = { callLLM, parseJsonResponse, isAIAvailable };
