// Contract controller — العقود الإلكترونية والتوقيع والضمان
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Contract = require('../models/Contract');
const Project = require('../models/Project');
const Bid = require('../models/Bid');
const PlatformSettings = require('../models/PlatformSettings');
const Transaction = require('../models/Transaction');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { logAudit } = require('../utils/audit');
const env = require('../config/env');

const { generatePDFContract } = require('../utils/pdfGenerator');

const SIG_DIR = path.join(env.UPLOADS_DIR, 'signatures');

function saveSignatureImage(signatureData, contractId, role) {
  if (!signatureData || !signatureData.startsWith('data:image')) return null;
  if (!fs.existsSync(SIG_DIR)) fs.mkdirSync(SIG_DIR, { recursive: true });
  const base64 = signatureData.replace(/^data:image\/\w+;base64,/, '');
  const filename = `sig_${contractId}_${role}_${Date.now()}.png`;
  fs.writeFileSync(path.join(SIG_DIR, filename), Buffer.from(base64, 'base64'));
  return filename;
}

function enrichContract(contract) {
  if (!contract) return contract;
  const base = env.NODE_ENV === 'production' ? '' : '';
  const sigUrl = (filename) => (filename ? `/uploads/signatures/${filename}` : null);
  if (contract.customerSignature?.signatureImage) {
    contract.customerSignature.signatureImageUrl = sigUrl(contract.customerSignature.signatureImage);
  }
  if (contract.contractorSignature?.signatureImage) {
    contract.contractorSignature.signatureImageUrl = sigUrl(contract.contractorSignature.signatureImage);
  }
  return contract;
}

// POST /api/contracts/generate — بيولد عقد بعد قبول العرض
const generateContract = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) throw new AppError('معرف المشروع مطلوب', 400, 'MISSING_PROJECT');

  const project = await Project.findById(projectId).populate('postedBy', 'name email phone');
  if (!project) throw new AppError('المشروع غير موجود', 404, 'NOT_FOUND');
  if (project.status !== 'awarded') throw new AppError('المشروع لازم يكون مُرسى أولاً', 400, 'NOT_AWARDED');

  // التأكد من عدم وجود عقد سابق
  const existingContract = await Contract.findOne({ project: project._id });
  if (existingContract) {
    const populated = await Contract.findById(existingContract._id)
      .populate('customer', 'name email phone')
      .populate('contractor', 'name email phone specialty')
      .lean();
    return res.json({ contract: enrichContract(populated), existing: true });
  }

  const bid = await Bid.findById(project.awardedBidId);
  if (!bid) throw new AppError('العرض الفائز غير موجود', 404, 'BID_NOT_FOUND');

  const commissionRate = await PlatformSettings.getSetting('commissionRate') || 0.02;
  const warrantyCap = Math.min(
    bid.amount * (await PlatformSettings.getSetting('warrantyCapPercent') || 0.10),
    await PlatformSettings.getSetting('warrantyCapMaxEGP') || 50000
  );

  let contract = await Contract.create({
    project: project._id,
    bid: bid._id,
    customer: project.postedBy._id,
    contractor: project.awardedTo,
    projectTitle: project.title,
    projectType: project.projectType,
    bidAmount: bid.amount,
    proposedDuration: bid.proposedDurationDays,
    propertyDetails: project.propertyDetails,
    commissionRate,
    warrantyCapEGP: warrantyCap,
    status: 'pending_signatures',
    generatedAt: new Date(),
  });

  // توليد PDF مبدئي
  contract = await Contract.findById(contract._id)
    .populate('customer', 'name email phone nationalId')
    .populate('contractor', 'name email phone specialty nationalId');
  const pdfFilename = await generatePDFContract(contract);
  contract.pdfFilename = pdfFilename;
  await contract.save();

  logger.info({ contractId: contract._id.toString(), projectId: project._id.toString() }, 'Contract generated');
  res.status(201).json({ contract: enrichContract(contract.toObject()) });
});

// POST /api/contracts/:id/sign — توقيع العقد
const signContract = asyncHandler(async (req, res) => {
  let contract = await Contract.findById(req.params.id)
    .populate('customer', 'name')
    .populate('contractor', 'name');
    
  if (!contract) throw new AppError('العقد غير موجود', 404, 'NOT_FOUND');
  if (contract.status !== 'pending_signatures') {
    throw new AppError('العقد ليس في حالة انتظار التوقيع', 400, 'WRONG_STATUS');
  }

  const { signatureData } = req.body; // base64 canvas data أو hash
  const signatureHash = crypto.createHash('sha256').update(signatureData || Date.now().toString()).digest('hex');
  const sigRole = contract.customer._id.toString() === req.user._id.toString() ? 'customer' : 'contractor';
  const signatureImage = saveSignatureImage(signatureData, contract._id.toString(), sigRole);
  const signaturePayload = {
    signed: true,
    signedAt: new Date(),
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    userAgent: (req.headers['user-agent'] || '').slice(0, 300),
    signatureHash,
    signatureImage,
  };

  const isCustomer = contract.customer._id.toString() === req.user._id.toString();
  const isContractor = contract.contractor._id.toString() === req.user._id.toString();

  if (!isCustomer && !isContractor) {
    throw new AppError('غير مصرح بالتوقيع على هذا العقد', 403, 'FORBIDDEN');
  }

  if (isCustomer) {
    if (contract.customerSignature?.signed) throw new AppError('لقد وقعت بالفعل', 409, 'ALREADY_SIGNED');
    contract.customerSignature = signaturePayload;
  } else {
    if (contract.contractorSignature?.signed) throw new AppError('لقد وقعت بالفعل', 409, 'ALREADY_SIGNED');
    contract.contractorSignature = signaturePayload;
  }

  // لو الاتنين وقعوا → العقد فعّال
  if (contract.customerSignature?.signed && contract.contractorSignature?.signed) {
    contract.status = 'active';
    contract.warrantyStatus = 'active';
  }

  await contract.save();

  // إعادة توليد الـ PDF بعد التوقيع مع بيانات الأطراف كاملة
  const populated = await Contract.findById(contract._id)
    .populate('customer', 'name email phone nationalId')
    .populate('contractor', 'name email phone specialty nationalId');
  const pdfFilename = await generatePDFContract(populated);
  populated.pdfFilename = pdfFilename;
  await populated.save();

  logger.info({ contractId: contract._id.toString(), signedBy: req.user._id.toString() }, 'Contract signed');
  res.json({ contract: enrichContract(populated.toObject()) });
});

// GET /api/contracts/:id — عرض بيانات العقد
const getContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('contractor', 'name email phone specialty')
    .populate('project', 'title status')
    .lean();
  if (!contract) throw new AppError('العقد غير موجود', 404, 'NOT_FOUND');

  // التأكد من الصلاحية
  const userId = req.user._id.toString();
  const isParty = contract.customer._id.toString() === userId || contract.contractor._id.toString() === userId;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  if (!isParty && !isAdmin) throw new AppError('غير مصرح', 403, 'FORBIDDEN');

  res.json({ contract: enrichContract(contract) });
});

// GET /api/contracts/project/:projectId — عقد مشروع معين
const getContractByProject = asyncHandler(async (req, res) => {
  const contract = await Contract.findOne({ project: req.params.projectId })
    .populate('customer', 'name email phone')
    .populate('contractor', 'name email phone specialty')
    .lean();
  if (!contract) throw new AppError('لا يوجد عقد لهذا المشروع', 404, 'NOT_FOUND');

  const userId = req.user._id.toString();
  const isParty = contract.customer._id.toString() === userId || contract.contractor._id.toString() === userId;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  if (!isParty && !isAdmin) throw new AppError('غير مصرح', 403, 'FORBIDDEN');

  res.json({ contract: enrichContract(contract) });
});

// POST /api/contracts/:id/claim — تقديم مطالبة ضمان
const fileClaim = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) throw new AppError('العقد غير موجود', 404, 'NOT_FOUND');
  if (contract.customer.toString() !== req.user._id.toString()) {
    throw new AppError('فقط العميل يمكنه تقديم مطالبة', 403, 'FORBIDDEN');
  }
  if (contract.warrantyStatus !== 'active') {
    throw new AppError('الضمان غير فعال لهذا العقد', 400, 'WARRANTY_INACTIVE');
  }

  const { reason } = req.body;
  if (!reason || reason.length < 10) throw new AppError('سبب المطالبة مطلوب (10 أحرف على الأقل)', 400, 'MISSING_REASON');

  contract.warrantyStatus = 'claimed';
  contract.status = 'disputed';
  contract.warrantyClaim = {
    reason,
    claimedAt: new Date(),
  };
  await contract.save();

  logger.info({ contractId: contract._id.toString() }, 'Warranty claim filed');
  res.json({ contract, message: 'تم تقديم مطالبة الضمان بنجاح. الإدارة ستراجعها.' });
});

// POST /api/contracts/:id/resolve — الإدارة تحل النزاع (admin فقط)
const resolveClaim = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) throw new AppError('العقد غير موجود', 404, 'NOT_FOUND');
  if (contract.warrantyStatus !== 'claimed') {
    throw new AppError('لا توجد مطالبة ضمان قائمة', 400, 'NO_CLAIM');
  }

  const { resolution, compensationAmount } = req.body;
  if (!resolution) throw new AppError('قرار الحل مطلوب', 400, 'MISSING_RESOLUTION');

  // clamp بين 0 وسقف الضمان — يمنع قيم سالبة أو تجاوز السقف
  const compensation = Math.max(0, Math.min(Number(compensationAmount) || 0, contract.warrantyCapEGP));

  contract.warrantyStatus = 'resolved';
  contract.status = 'completed';
  contract.warrantyClaim.resolvedAt = new Date();
  contract.warrantyClaim.resolution = resolution;
  contract.warrantyClaim.compensationAmount = compensation;
  await contract.save();

  // تسجيل معاملة تعويض الضمان — نفس منطق نزاعات الـ Escrow
  if (compensation > 0) {
    await Transaction.create({
      user: contract.customer,
      type: 'warranty_payout',
      amount: compensation,
      status: 'success',
      gateway: 'platform',
      relatedProject: contract.project,
      relatedContract: contract._id,
      meta: { resolution },
    });
  }

  logAudit(req.user._id, 'resolve_warranty_claim', 'Contract', contract._id, { resolution, compensation });
  logger.info({ contractId: contract._id.toString(), adminId: req.user._id.toString() }, 'Warranty claim resolved');
  res.json({ contract });
});

// GET /api/contracts/:id/pdf — تحميل العقد PDF
const downloadPDF = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) throw new AppError('العقد غير موجود', 404, 'NOT_FOUND');

  const userId = req.user._id.toString();
  const isParty = contract.customer.toString() === userId || contract.contractor.toString() === userId;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  if (!isParty && !isAdmin) throw new AppError('غير مصرح', 403, 'FORBIDDEN');

  // لو الملف غير متولد أو مفقود من القرص — نولّده عند الطلب
  let filePath = contract.pdfFilename
    ? path.join(env.UPLOADS_DIR, 'contracts', contract.pdfFilename)
    : null;

  if (!filePath || !fs.existsSync(filePath)) {
    const populated = await Contract.findById(contract._id)
      .populate('customer', 'name email phone nationalId')
      .populate('contractor', 'name email phone specialty nationalId');
    const pdfFilename = await generatePDFContract(populated);
    populated.pdfFilename = pdfFilename;
    await populated.save();
    contract.pdfFilename = pdfFilename;
    filePath = path.join(env.UPLOADS_DIR, 'contracts', pdfFilename);
  }

  res.download(filePath, contract.pdfFilename);
});

module.exports = { generateContract, signContract, getContract, getContractByProject, fileClaim, resolveClaim, downloadPDF };
