const mongoose = require('mongoose');

const creditLedgerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    delta: { type: Number, required: true },
    reason: {
      type: String,
      required: true,
      enum: ['signup_grant', 'bid_submit', 'bid_submit_refund', 'admin_adjust', 'purchase', 'referral'],
    },
    balanceAfter: { type: Number, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', default: null },
    meta: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

creditLedgerSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CreditLedger', creditLedgerSchema);
