// el User model el asasy — feeh discriminators 3ashan customer / contractor / admin kolo fe nafs el collection
const mongoose = require('mongoose');

// el schema el asasy — kol el haga el moshtarka been el 3 types
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      // masry format
      match: /^01[0125]\d{8}$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // ma yetba3atsh ma3 el query by default
    },
    role: {
      type: String,
      enum: ['customer', 'contractor', 'admin', 'super_admin'],
      required: true,
      index: true,
    },
    // status: active = yegnal normal, pending = mos7tantr admin approval, suspended = m2fool
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
      index: true,
    },
    // NID for login (used by everyone, customers and contractors)
    nationalIdHash: { type: String, required: true, select: false, unique: true },
    nationalIdLast4: { type: String, required: true, minlength: 4, maxlength: 4 },

    // login failure tracking lel rate-limiting / lockout
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    // 🎉 flag bybaan en el contractor etfada lel mara el awla ba3d el activation
    // betbaan true lama el admin y2bal el account, w betetzabat false ba3d awel login
    firstLoginAfterActivation: { type: Boolean, default: false },

    // ===== Email verification & OTP =====
    isEmailVerified: { type: Boolean, default: false },
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },
    // ===== Password reset =====
    resetToken: {
      hash: { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },
    // ===== Referral =====
    referralCode: { type: String, unique: true, sparse: true, index: true },
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
  }
);

// byshel el haga el 7asasa men el JSON output
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  delete obj.otp;
  delete obj.resetToken;
  return obj;
};

// el function dy byshoof law el 7esab maqfool dlw2ty
userSchema.methods.isLocked = function isLocked() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

const User = mongoose.model('User', userSchema);

module.exports = User;

