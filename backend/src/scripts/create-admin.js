/**
 * create-admin.js — standalone script to seed an admin user
 *
 * Usage:
 *   node backend/src/scripts/create-admin.js
 *   node backend/src/scripts/create-admin.js admin@elmoquwal.com Admin@123
 *
 * Defaults (if no args supplied):
 *   email    = admin@elmoquwal.com
 *   password = Admin@123
 */

'use strict';

const path = require('path');
const crypto = require('crypto');

// Load .env relative to backend root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { hashPassword } = require('../utils/password');

// We need to register the discriminators so mongoose knows about 'admin'
const User    = require('../models/User');
const Admin   = require('../models/AdminProfile');
// Also register other discriminators to avoid "Schema hasn't been registered" warnings
require('../models/CustomerProfile');
require('../models/ContractorProfile');

// ── Config ────────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not set. Make sure backend/.env exists.');
  process.exit(1);
}

const [, , argEmail, argPassword] = process.argv;
const EMAIL    = argEmail    || 'admin@elmoquwal.com';
const PASSWORD = argPassword || 'Admin@123';

// Admin users don't need a real national ID — we use a deterministic placeholder
// so re-running the script doesn't fail the unique index.
const DUMMY_NID = '00000000000000'; // 14 zeros — clearly synthetic

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashNID(nid) {
  return crypto.createHash('sha256').update(nid).digest('hex');
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\n🔧  El Moquwal — Admin Seeder`);
  console.log(`    Target : ${EMAIL}`);

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅  Connected to MongoDB');

    // Check if admin already exists
    const existing = await Admin.findOne({ email: EMAIL });
    if (existing) {
      console.log(`ℹ️   Admin already exists (id: ${existing._id}). Nothing to do.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const passwordHash = await hashPassword(PASSWORD);
    const nidHash      = hashNID(DUMMY_NID);

    const admin = await Admin.create({
      name          : 'مدير المنصة',
      email         : EMAIL,
      phone         : '01000000000',   // placeholder — admin logs in by email only
      passwordHash,
      nationalIdHash: nidHash,
      nationalIdLast4: DUMMY_NID.slice(-4),
      status        : 'active',
      permissions   : ['review_projects', 'approve_contractors', 'manage_users'],
    });

    console.log(`\n🎉  Admin created successfully!`);
    console.log(`    ID       : ${admin._id}`);
    console.log(`    Email    : ${EMAIL}`);
    console.log(`    Password : ${PASSWORD}`);
    console.log(`\n    Login at : /auth/admin-login.html\n`);

  } catch (err) {
    if (err.code === 11000) {
      console.error('❌  Duplicate key — an account with this email or NID hash already exists.');
    } else {
      console.error('❌  Error:', err.message);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
