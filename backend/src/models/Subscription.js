// Subscription — اشتراكات Premium للمقاولين
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'premium',
    },
    priceEGP: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
    creditsGranted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
