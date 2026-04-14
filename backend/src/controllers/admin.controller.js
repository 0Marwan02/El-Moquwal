// el controller bta3 el admin — review contractors, approve/reject
const { z } = require('zod');
const mongoose = require('mongoose');

const Contractor = require('../models/ContractorProfile');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// schema lel approve/reject action
const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'لازم تكتب سبب الرفض').max(500),
});

// byt2kd en el id sa7 bel mongo
function assertValidId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('معرف غير صحيح', 400, 'INVALID_ID');
  }
}

// GET /api/admin/contractors/pending — kol el contractors el lessa fe el intidhar
const listPending = asyncHandler(async (req, res) => {
  const pending = await Contractor.find({ role: 'contractor', status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ items: pending, total: pending.length });
});

// POST /api/admin/contractors/:id/approve
const approveContractor = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const contractor = await Contractor.findOne({ _id: req.params.id, role: 'contractor' });
  if (!contractor) throw new AppError('المقاول غير موجود', 404, 'NOT_FOUND');
  if (contractor.status === 'active') {
    return res.json({ ok: true, message: 'تم قبول الحساب من قبل' });
  }

  contractor.status = 'active';
  contractor.approvedBy = req.user._id;
  contractor.approvedAt = new Date();
  contractor.rejectionReason = null;
  await contractor.save();

  logger.info({ contractorId: contractor._id.toString(), adminId: req.user._id.toString() }, 'Contractor approved');
  res.json({ ok: true, user: contractor.toJSON() });
});

// POST /api/admin/contractors/:id/reject
const rejectContractor = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const { reason } = rejectSchema.parse(req.body);

  const contractor = await Contractor.findOne({ _id: req.params.id, role: 'contractor' });
  if (!contractor) throw new AppError('المقاول غير موجود', 404, 'NOT_FOUND');

  contractor.status = 'suspended';
  contractor.rejectionReason = reason;
  await contractor.save();

  logger.info({ contractorId: contractor._id.toString(), adminId: req.user._id.toString() }, 'Contractor rejected');
  res.json({ ok: true, user: contractor.toJSON() });
});

module.exports = { listPending, approveContractor, rejectContractor };
