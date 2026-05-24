// PlatformSettings — إعدادات المنصة القابلة للتعديل من الأدمن
const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String, default: '' },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Defaults — بيتساب لو مش موجودين
const DEFAULTS = {
  commissionRate: { value: 0.02, description: 'نسبة عمولة المنصة (0.02 = 2%)' },
  warrantyCapPercent: { value: 0.10, description: 'سقف الضمان كنسبة من قيمة المشروع' },
  warrantyCapMaxEGP: { value: 50000, description: 'سقف الضمان الأقصى بالجنيه' },
  premiumPriceEGP: { value: 199, description: 'سعر اشتراك Premium الشهري' },
  premiumMonthlyCredits: { value: 10, description: 'نقاط مجانية شهرية لمشتركي Premium' },
  creditPackPriceEGP: { value: 50, description: 'سعر حزمة النقاط' },
  creditPackAmount: { value: 5, description: 'عدد النقاط في الحزمة' },
  featuredProjectPriceEGP: { value: 100, description: 'رسوم تمييز المشروع' },
  featuredProjectDurationDays: { value: 7, description: 'مدة تمييز المشروع بالأيام' },
  referralBonusCredits: { value: 2, description: 'نقاط مكافأة الإحالة' },
};

/**
 * بيجيب إعداد معين — لو مش موجود بيرجع الديفولت
 */
platformSettingsSchema.statics.getSetting = async function getSetting(key) {
  const doc = await this.findOne({ key }).lean();
  if (doc) return doc.value;
  return DEFAULTS[key]?.value ?? null;
};

/**
 * بيحدث إعداد معين
 */
platformSettingsSchema.statics.setSetting = async function setSetting(key, value, adminId) {
  return this.findOneAndUpdate(
    { key },
    {
      $set: {
        value,
        lastUpdatedBy: adminId,
        description: DEFAULTS[key]?.description || '',
      },
    },
    { upsert: true, new: true }
  );
};

/**
 * بيرجع كل الإعدادات مع الديفولت لو ناقصة
 */
platformSettingsSchema.statics.getAll = async function getAll() {
  const docs = await this.find().lean();
  const map = {};
  docs.forEach((d) => { map[d.key] = d.value; });
  // merge with defaults
  const result = {};
  for (const [k, v] of Object.entries(DEFAULTS)) {
    result[k] = map[k] !== undefined ? map[k] : v.value;
  }
  return result;
};

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
PlatformSettings.DEFAULTS = DEFAULTS;

module.exports = PlatformSettings;
