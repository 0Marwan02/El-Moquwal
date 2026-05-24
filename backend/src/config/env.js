// el file da bey2ra el .env we by3mel validation 3aleh 3ashan lo fy 7aga na2sa el server ma y2oomsh
const { z } = require('zod');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// el schema elly by-define el shakl el sa7 bta3 el env variables
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(10, 'MONGO_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CORS_ORIGIN: z.string().default(''),
  COOKIE_DOMAIN: z.string().optional().default(''),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  UPLOADS_DIR: z.string().default('./uploads'),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().default(5),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  HF_API_TOKEN: z.string().optional().default(''),
  HF_MODEL: z.string().optional().default('Qwen/Qwen2.5-72B-Instruct'),
  CONTRACTOR_INITIAL_CREDITS: z.coerce.number().int().min(0).max(1000).default(5),
  BID_CREDIT_COST_DEFAULT: z.coerce.number().int().min(1).max(100).default(1),
  BID_CREDIT_COST_ABOVE_1M: z.coerce.number().int().min(1).max(100).default(5),
  // Email / OTP
  REQUIRE_EMAIL_VERIFICATION: z.enum(['true', 'false']).default('false'),
  SMTP_HOST: z.string().optional().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('noreply@elmoquwal.com'),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
  // Platform settings
  PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.02),
  WARRANTY_CAP_PERCENT: z.coerce.number().min(0).max(1).default(0.10),
  WARRANTY_CAP_MAX_EGP: z.coerce.number().int().min(0).default(50000),
  PREMIUM_PRICE_EGP: z.coerce.number().int().min(0).default(199),
  PREMIUM_MONTHLY_CREDITS: z.coerce.number().int().min(0).default(10),
  CREDIT_PACK_PRICE_EGP: z.coerce.number().int().min(0).default(50),
  CREDIT_PACK_AMOUNT: z.coerce.number().int().min(1).default(5),
  // Payment gateways
  PAYMOB_API_KEY: z.string().optional().default(''),
  PAYMOB_HMAC_SECRET: z.string().optional().default(''),
  FAWRY_MERCHANT_CODE: z.string().optional().default(''),
  FAWRY_SECURITY_KEY: z.string().optional().default(''),
});

// by3mel parse lel process.env we lo feeh errors byktebha we y2fel el app
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// by7awel el string bta3 el CORS le array
const corsOrigins = parsed.data.CORS_ORIGIN
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// byseddar el env el sa7 3ashan el ba2y ye5odo menno
module.exports = {
  ...parsed.data,
  CORS_ORIGINS: corsOrigins,
  IS_PROD: parsed.data.NODE_ENV === 'production',
  REQUIRE_EMAIL_VERIFICATION: parsed.data.REQUIRE_EMAIL_VERIFICATION === 'true',
};
