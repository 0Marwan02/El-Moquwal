// Contract — العقد الإلكتروني بين العميل والمقاول
const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema(
  {
    signed: { type: Boolean, default: false },
    signedAt: { type: Date, default: null },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, maxlength: 300, default: '' },
    signatureHash: { type: String, default: '' }, // SHA256 of canvas data
    signatureImage: { type: String, default: null }, // filename under uploads/signatures/
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
    },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // snapshot بيانات المشروع وقت التوليد
    projectTitle: { type: String, required: true },
    projectType: { type: String, required: true },
    bidAmount: { type: Number, required: true },
    proposedDuration: { type: Number, default: null },
    propertyDetails: { type: mongoose.Schema.Types.Mixed, default: {} },

    // شروط المنصة
    commissionRate: { type: Number, default: 0.02 },
    warrantyCapEGP: { type: Number, default: 0 },

    // التوقيعات
    customerSignature: { type: signatureSchema, default: () => ({}) },
    contractorSignature: { type: signatureSchema, default: () => ({}) },

    // حالة العقد
    status: {
      type: String,
      enum: ['draft', 'pending_signatures', 'active', 'completed', 'disputed'],
      default: 'draft',
      index: true,
    },

    // PDF المُولّد
    pdfFilename: { type: String, default: null },
    generatedAt: { type: Date, default: null },

    // الضمان
    warrantyStatus: {
      type: String,
      enum: ['none', 'active', 'claimed', 'resolved'],
      default: 'none',
    },
    warrantyClaim: {
      reason: { type: String, default: '' },
      claimedAt: { type: Date, default: null },
      resolvedAt: { type: Date, default: null },
      resolution: { type: String, default: '' },
      compensationAmount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

contractSchema.index({ customer: 1 });
contractSchema.index({ contractor: 1 });

module.exports = mongoose.model('Contract', contractSchema);
