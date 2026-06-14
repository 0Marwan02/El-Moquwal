// AuditLog — سجل عمليات الإدارة (موافقات، حسم نزاعات، تعديل إعدادات وصلاحيات)
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // approve_contractor, resolve_escrow_dispute, update_settings, ...
    targetType: { type: String, default: null }, // User / Contract / Escrow / Settings ...
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
