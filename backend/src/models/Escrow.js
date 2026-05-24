// Escrow — حجز أموال العميل وتوزيعها بالمراحل
const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['pending', 'released', 'disputed'],
      default: 'pending',
    },
    releasedAt: { type: Date, default: null },
  },
  { _id: true }
);

const escrowSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
    },
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', default: null },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, default: 0, min: 0 }, // totalAmount - commissionAmount
    currency: { type: String, default: 'EGP' },
    status: {
      type: String,
      enum: ['held', 'partially_released', 'released', 'disputed', 'refunded'],
      default: 'held',
      index: true,
    },
    milestones: { type: [milestoneSchema], default: [] },
    depositedAt: { type: Date, default: Date.now },
    fullyReleasedAt: { type: Date, default: null },

    // ===== نظام النزاعات (Level 1.5) =====
    disputeReason: { type: String, default: null },
    disputeOpenedAt: { type: Date, default: null },
    disputeOpenedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    disputeResolution: {
      decision: { type: String, enum: ['release_to_contractor', 'refund_to_customer', 'split'], default: null },
      warrantyDeduction: { type: Number, default: 0 },
      adminNote: { type: String, default: '' },
      resolvedAt: { type: Date, default: null },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
  },
  { timestamps: true }
);

escrowSchema.index({ customer: 1 });
escrowSchema.index({ contractor: 1 });

module.exports = mongoose.model('Escrow', escrowSchema);
