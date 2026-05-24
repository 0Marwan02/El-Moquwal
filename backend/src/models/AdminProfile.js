// AdminProfile discriminator — للأدمن العادي (المراجع) الذي ينشئه الـ super_admin
const mongoose = require('mongoose');
const User = require('./User');

const adminSchema = new mongoose.Schema({
  // الصلاحيات المتاحة للأدمن العادي (بيحددها الـ super_admin)
  permissions: {
    type: [String],
    default: ['review_contractors', 'view_projects', 'view_stats'],
    enum: [
      'review_contractors',    // مراجعة وقبول/رفض المقاولين
      'view_projects',         // عرض كل المشاريع
      'view_stats',            // عرض الإحصائيات
      'manage_disputes',       // إدارة النزاعات والضمان
      'manage_featured',       // إدارة المشاريع المميزة
      'manage_materials',      // إدارة سوق المواد
      'adjust_credits',        // تعديل رصيد نقاط المقاولين
    ],
  },
  // مين اللي أنشأ الأدمن ده
  createdBySuperAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  notes: { type: String, maxlength: 500, default: '' },
});

const Admin = User.discriminator('admin', adminSchema);

module.exports = Admin;
