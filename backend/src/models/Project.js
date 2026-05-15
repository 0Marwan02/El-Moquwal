// el Project model — el مشروع اللي بيرفعه صاحب العقار
const mongoose = require('mongoose');

// el photo subdocument — path, original name, mime, size
const photoSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// el AI estimate subdocument — el تقدير السعر من الذكاء الاصطناعي
const aiEstimateSchema = new mongoose.Schema(
  {
    minEstimate: { type: Number },
    maxEstimate: { type: Number },
    currency: { type: String, default: 'EGP' },
    reasoning: { type: String }, // شرح مختصر بالعربي
    estimatedAt: { type: Date, default: Date.now },
    model: { type: String, default: 'claude-sonnet-4-6' },
  },
  { _id: false }
);

// el propertyDetails subdocument — تفاصيل العقار
const propertyDetailsSchema = new mongoose.Schema(
  {
    governorate: { type: String, required: true }, // المحافظة
    city: { type: String, default: '' },           // المدينة / الحي
    district: { type: String, default: '' },       // المنطقة
    area: { type: Number, required: true, min: 10, max: 50000 }, // المساحة بالمتر المربع
    floors: { type: Number, default: 1, min: 1, max: 30 },       // عدد الطوابق
    rooms: { type: Number, default: 0, min: 0 },                 // عدد الغرف
    bathrooms: { type: Number, default: 0, min: 0 },             // عدد الحمامات
    // إحداثيات GPS اختيارية — بتتملى من زرار «موقعي الحالي» في الواجهة
    gpsCoords: {
      type: new mongoose.Schema(
        {
          lat: { type: Number, min: -90, max: 90 },
          lng: { type: Number, min: -180, max: 180 },
        },
        { _id: false }
      ),
      default: null,
    },
  },
  { _id: false }
);

// el main project schema
const projectSchema = new mongoose.Schema(
  {
    // عنوان المشروع
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },

    // وصف إضافي
    description: {
      type: String,
      maxlength: 1000,
      default: '',
    },

    // نوع المشروع
    projectType: {
      type: String,
      required: true,
      enum: [
        'new_construction', // بناء جديد
        'finishing',        // تشطيبات
        'renovation',       // تجديد
        'repair',           // إصلاح
        'extension',        // توسعة
        'demolition',       // هدم
        'electrical',       // كهرباء
        'plumbing',         // سباكة
        'other',            // أخرى
      ],
      index: true,
    },

    // تفاصيل العقار
    propertyDetails: { type: propertyDetailsSchema, required: true },

    // المتطلبات المحددة (مرنة حسب نوع المشروع)
    requirements: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // نطاق الميزانية المفضل
    budgetRange: {
      type: String,
      enum: [
        'under_50k',       // أقل من 50,000
        '50k_200k',        // 50,000 - 200,000
        '200k_500k',       // 200,000 - 500,000
        '500k_1m',         // 500,000 - 1,000,000
        'above_1m',        // أكثر من 1,000,000
        'flexible',        // مرن
      ],
    },

    // الجدول الزمني
    timeline: {
      type: String,
      enum: [
        'within_week',     // خلال أسبوع
        'within_month',    // خلال شهر
        '1_3_months',      // 1-3 أشهر
        '3_6_months',      // 3-6 أشهر
        'flexible',        // مرن
      ],
    },

    // عدد المهندسين المطلوبين — 0 = يقرر المقاول
    requiredEngineers: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },

    // الصور المرفوعة (max 20)
    photos: {
      type: [photoSchema],
      validate: {
        validator: (v) => v.length <= 20,
        message: 'لا يمكن رفع أكثر من 20 صورة',
      },
      default: [],
    },

    // تقدير الذكاء الاصطناعي — بيتحسب بعد نشر المشروع
    aiEstimatedPrice: { type: aiEstimateSchema, default: null },

    // حالة المشروع
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'awarded'],
      default: 'draft',
      index: true,
    },

    // صاحب المشروع (customer)
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // المقاول الفائز (بعد قبول عرض)
    awardedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    awardedBidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
      default: null,
    },
    awardedAt: { type: Date, default: null },

    // إغلاق المشروع وتقييم المقاول
    closedAt: { type: Date, default: null },
    clientRating: { type: Number, default: null, min: 1, max: 5 },
    clientReview: { type: String, default: '', maxlength: 500 },

    // عدد العروض المقدمة — denormalized للأداء
    bidsCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

// indexes لتسهيل البحث والفلترة
projectSchema.index({ status: 1, projectType: 1 });
projectSchema.index({ 'propertyDetails.governorate': 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
