// Transaction — سجل المعاملات المالية (وهمي / حقيقي)
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'credit_purchase',      // شراء نقاط
        'escrow_deposit',       // إيداع ضمان
        'escrow_release',       // صرف من الضمان
        'commission',           // عمولة المنصة
        'subscription',         // اشتراك Premium
        'featured_project',     // مشروع مميز
        'refund',               // استرداد
        'warranty_payout',      // تعويض ضمان للعميل (قرار إداري)
      ],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EGP' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    gateway: {
      type: String,
      enum: ['mock', 'paymob', 'fawry', 'platform'],
      default: 'mock',
    },
    gatewayTransactionId: { type: String, default: null },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    relatedContract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
