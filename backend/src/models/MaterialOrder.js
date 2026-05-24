// MaterialOrder — طلبات شراء المواد من سوق B2B
const mongoose = require('mongoose');

const materialOrderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    currency: { type: String, default: 'EGP' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    buyerNotes: { type: String, maxlength: 300, default: '' },
    sellerNotes: { type: String, maxlength: 300, default: '' },
    confirmedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

materialOrderSchema.index({ buyer: 1, createdAt: -1 });
materialOrderSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('MaterialOrder', materialOrderSchema);
