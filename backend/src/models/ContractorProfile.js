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
  // el fayelat el rsmya
  certificate: { type: uploadedFileSchema, required: true },
  membershipCard: { type: uploadedFileSchema, required: true },
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
});

const Contractor = User.discriminator('contractor', contractorSchema);

module.exports = Contractor;
