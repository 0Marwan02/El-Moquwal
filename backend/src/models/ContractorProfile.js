// el discriminator bta3 el contractor — specialty, experience, we el fayelat el mrfo3a
const mongoose = require('mongoose');
const User = require('./User');

// el file subdocument — path, original name, mime, size
const uploadedFileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true }, // el esm el random 3ala el disk
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// el contractor schema nafsoh
const contractorSchema = new mongoose.Schema({
  specialty: {
    type: String,
    required: true,
    enum: [
      'civil_engineer',   // mohandes madany
      'architect',        // mohandes m3mary
      'electrical',       // kahraba2y
      'plumber',          // sabak
      'carpenter',        // naggar
      'painter',          // na2ash
      'general_contractor', // moqawel 3am
      'finishing',        // tashtebat
      'other',
    ],
  },
  yearsOfExperience: { type: Number, required: true, min: 0, max: 60 },
  bio: { type: String, maxlength: 500, default: '' },
  // el fayelat el rsmya — certificate we membershipCard optional
  certificate: { type: uploadedFileSchema, required: false, default: null },
  membershipCard: { type: uploadedFileSchema, required: false, default: null },
  // soura el beta2a el wataneya — MANDATORY
  nationalIdPhoto: { type: uploadedFileSchema, required: true },
  // soura el profile — OPTIONAL
  profilePicture: { type: uploadedFileSchema, required: false, default: null },
  // rejection reason law el admin rafad
  rejectionReason: { type: String, default: null },
  // ay notes men el admin
  adminNotes: { type: String, default: null },
  // approved by which admin
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  // rating + portfolio hanet3ml fehom fe marahel gayya
  rating: { type: Number, default: 0, min: 0, max: 5 },
  completedProjects: { type: Number, default: 0 },
  // نقاط تقديم العروض (MON-CREDITS-01) — هدية تسجيل افتراضية
  creditBalance: { type: Number, default: 5, min: 0, max: 1000000 },

  // ===== Premium Subscription =====
  isPremium: { type: Boolean, default: false, index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
  premiumUntil: { type: Date, default: null },

  // ===== Referral =====
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const Contractor = User.discriminator('contractor', contractorSchema);

module.exports = Contractor;
