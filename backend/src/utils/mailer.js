// خدمة الإيميل — Nodemailer (وهمي في التطوير، حقيقي في الإنتاج)
const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('./logger');

// لو مفيش بيانات SMTP → console transport وهمي
const isRealSMTP = env.SMTP_USER && env.SMTP_PASS;

const transporter = isRealSMTP
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : nodemailer.createTransport({
      jsonTransport: true, // بيطبع الإيميل في الـ log بدل ما يبعته
    });

/**
 * إرسال كود OTP لتفعيل الحساب
 */
async function sendOTP(email, code) {
  const mailOptions = {
    from: `"منصة المقاول" <${env.SMTP_FROM}>`,
    to: email,
    subject: 'كود تفعيل حسابك — منصة المقاول',
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;">
        <h2 style="color:#1a56db;">مرحباً بك في منصة المقاول 🏗️</h2>
        <p>كود التفعيل الخاص بك هو:</p>
        <div style="background:#f0f4ff;padding:16px;border-radius:8px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a56db;">
          ${code}
        </div>
        <p style="margin-top:16px;color:#666;">الكود صالح لمدة ${env.OTP_EXPIRY_MINUTES} دقائق فقط.</p>
        <p style="color:#999;font-size:12px;">لو ما طلبتش الكود ده، تجاهل الرسالة دي.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (!isRealSMTP) {
      logger.info({ to: email, code, envelope: JSON.parse(info.message).subject }, '📧 [MOCK] OTP email');
    } else {
      logger.info({ to: email, messageId: info.messageId }, 'OTP email sent');
    }
    return true;
  } catch (err) {
    logger.error({ err: err.message, to: email }, 'Failed to send OTP email');
    return false;
  }
}

/**
 * إرسال رابط استعادة كلمة المرور
 */
async function sendPasswordReset(email, resetToken) {
  // الرابط بيروح على صفحة reset-password.html مع التوكن في الـ query
  const baseUrl = env.IS_PROD ? 'https://elmoquwal.com' : `http://localhost:${env.PORT}`;
  const resetLink = `${baseUrl}/auth/reset-password.html?token=${resetToken}`;

  const mailOptions = {
    from: `"منصة المقاول" <${env.SMTP_FROM}>`,
    to: email,
    subject: 'استعادة كلمة المرور — منصة المقاول',
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;">
        <h2 style="color:#1a56db;">استعادة كلمة المرور 🔑</h2>
        <p>اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetLink}" style="background:#1a56db;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;">
            إعادة تعيين كلمة المرور
          </a>
        </div>
        <p style="color:#666;">الرابط صالح لمدة ساعة واحدة فقط.</p>
        <p style="color:#999;font-size:12px;">لو ما طلبتش استعادة كلمة المرور، تجاهل الرسالة دي.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (!isRealSMTP) {
      logger.info({ to: email, resetLink }, '📧 [MOCK] Password reset email');
    } else {
      logger.info({ to: email, messageId: info.messageId }, 'Password reset email sent');
    }
    return true;
  } catch (err) {
    logger.error({ err: err.message, to: email }, 'Failed to send password reset email');
    return false;
  }
}

module.exports = { sendOTP, sendPasswordReset };
