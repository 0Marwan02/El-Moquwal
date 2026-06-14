// audit helper — fire-and-forget، عمره ما يعطّل الـ response
const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

function logAudit(adminId, action, targetType = null, targetId = null, details = {}) {
  AuditLog.create({ admin: adminId, action, targetType, targetId, details })
    .catch((err) => logger.error({ err: err.message, action }, 'Failed to write audit log'));
}

module.exports = { logAudit };
