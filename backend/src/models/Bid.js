// el Bid model — عرض السعر اللي بيقدمه المقاول على مشروع
const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    // المشروع اللي عليه العرض
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    // المقاول اللي بعت العرض
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // قيمة العرض — سري على المنافسين (Blind Bidding)
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'EGP',
    },

    // رسالة المقاول لصاحب المشروع
    message: {
      type: String,
      maxlength: 500,
      default: '',
    },

    // المدة المقترحة بالأيام
    proposedDurationDays: {
      type: Number,
      min: 1,
      default: null,
    },

    // حالة العرض
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },

    // وقت الرد (قبول / رفض)
    respondedAt: { type: Date, default: null },

    // سبب الرفض (اختياري)
    rejectionReason: {
      type: String,
      maxlength: 300,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// مقاول واحد ما يقدرش يبعت أكتر من عرض واحد على نفس المشروع
bidSchema.index({ project: 1, contractor: 1 }, { unique: true });

// helper — بيرجع نسخة من العرض بدون المبلغ (للمنافسين في Blind Bidding)
bidSchema.methods.toBlindJSON = function toBlindJSON() {
  return {
    _id: this._id,
    project: this.project,
    status: this.status,
    createdAt: this.createdAt,
    // amount مش موجود هنا — Blind Bidding
  };
};

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid;
