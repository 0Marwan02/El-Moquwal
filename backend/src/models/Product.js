// Product — منتجات سوق المواد (B2B Material Market)
const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 1000, default: '' },
    category: {
      type: String,
      enum: [
        'cement', 'bricks', 'steel', 'wood', 'paint', 'tiles',
        'electrical', 'plumbing', 'insulation', 'glass', 'tools', 'other',
      ],
      default: 'other',
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'EGP' },
    unit: { type: String, default: 'قطعة', maxlength: 30 }, // طن، متر، قطعة...
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    images: { type: [productImageSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['active', 'sold_out', 'hidden'],
      default: 'active',
      index: true,
    },
    governorate: { type: String, default: '' }, // مكان البائع
  },
  { timestamps: true }
);

productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
