// Material controller — سوق المواد B2B
const { z } = require('zod');
const Product = require('../models/Product');
const MaterialOrder = require('../models/MaterialOrder');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// GET /api/materials — قائمة المنتجات
const listProducts = asyncHandler(async (req, res) => {
  const { category, governorate, page = 1, limit = 20 } = req.query;
  const filter = { status: 'active' };
  if (category) filter.category = category;
  if (governorate) filter.governorate = governorate;

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'name phone specialty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ products, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// GET /api/materials/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'name phone specialty')
    .lean();
  if (!product) throw new AppError('المنتج غير موجود', 404, 'NOT_FOUND');
  res.json({ product });
});

// POST /api/materials — إضافة منتج (مقاول فقط)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, category, price, unit, stock, governorate } = req.body;
  if (!name || !price) throw new AppError('الاسم والسعر مطلوبان', 400, 'VALIDATION_ERROR');

  const images = (req.files?.images || []).map((f) => ({
    filename: f.filename, originalName: f.originalname, mimetype: f.mimetype, size: f.size,
  }));

  const product = await Product.create({
    name, description: description || '', category: category || 'other',
    price: Number(price), unit: unit || 'قطعة', stock: Number(stock) || 0,
    seller: req.user._id, images, governorate: governorate || '',
  });

  res.status(201).json({ product });
});

// PATCH /api/materials/:id — تعديل منتج (البائع فقط)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('المنتج غير موجود', 404, 'NOT_FOUND');
  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  }

  const { name, description, category, price, unit, stock, status } = req.body;
  if (name) product.name = name;
  if (description !== undefined) product.description = description;
  if (category) product.category = category;
  if (price) product.price = Number(price);
  if (unit) product.unit = unit;
  if (stock !== undefined) product.stock = Number(stock);
  if (status) product.status = status;
  await product.save();

  res.json({ product });
});

// DELETE /api/materials/:id — حذف منتج (البائع فقط)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('المنتج غير موجود', 404, 'NOT_FOUND');
  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403, 'FORBIDDEN');
  }
  await product.deleteOne();
  res.json({ ok: true, message: 'تم حذف المنتج' });
});

// POST /api/materials/:id/order — طلب شراء
const placeOrder = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('المنتج غير موجود', 404, 'NOT_FOUND');
  if (product.status !== 'active') throw new AppError('المنتج غير متاح', 400, 'NOT_AVAILABLE');

  const { quantity, notes } = req.body;
  const qty = Number(quantity) || 1;
  if (product.stock > 0 && qty > product.stock) {
    throw new AppError(`الكمية المطلوبة أكبر من المتوفر (${product.stock})`, 400, 'INSUFFICIENT_STOCK');
  }

  const order = await MaterialOrder.create({
    buyer: req.user._id,
    seller: product.seller,
    product: product._id,
    quantity: qty,
    unitPrice: product.price,
    totalPrice: product.price * qty,
    buyerNotes: notes || '',
  });

  // تحديث المخزون
  if (product.stock > 0) {
    product.stock = Math.max(0, product.stock - qty);
    if (product.stock === 0) product.status = 'sold_out';
    await product.save();
  }

  res.status(201).json({ order });
});

// GET /api/materials/orders/mine — طلباتي
const myOrders = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'contractor'
    ? { $or: [{ buyer: req.user._id }, { seller: req.user._id }] }
    : { buyer: req.user._id };

  const orders = await MaterialOrder.find(filter)
    .populate('product', 'name price category')
    .populate('buyer', 'name phone')
    .populate('seller', 'name phone')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ orders });
});

// PATCH /api/materials/orders/:orderId — البائع يحدث حالة الطلب
const updateOrder = asyncHandler(async (req, res) => {
  const order = await MaterialOrder.findById(req.params.orderId);
  if (!order) throw new AppError('الطلب غير موجود', 404, 'NOT_FOUND');

  const isSeller = order.seller.toString() === req.user._id.toString();
  const isBuyer = order.buyer.toString() === req.user._id.toString();
  if (!isSeller && !isBuyer) throw new AppError('غير مصرح', 403, 'FORBIDDEN');

  const { status, sellerNotes } = req.body;

  if (status) {
    const sellerTransitions = { pending: ['confirmed', 'cancelled'], confirmed: ['shipped'], shipped: ['delivered'] };
    const buyerTransitions = { pending: ['cancelled'] };
    const allowed = isSeller ? sellerTransitions[order.status] : buyerTransitions[order.status];

    if (!allowed?.includes(status)) {
      throw new AppError(`لا يمكن تغيير الحالة من "${order.status}" إلى "${status}"`, 400, 'INVALID_TRANSITION');
    }

    order.status = status;
    if (status === 'confirmed') order.confirmedAt = new Date();
    if (status === 'delivered') order.deliveredAt = new Date();
  }

  if (sellerNotes !== undefined && isSeller) order.sellerNotes = sellerNotes;
  await order.save();

  const populated = await MaterialOrder.findById(order._id)
    .populate('product', 'name price category')
    .populate('buyer', 'name phone')
    .populate('seller', 'name phone')
    .lean();

  res.json({ order: populated });
});

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, placeOrder, myOrders, updateOrder };
