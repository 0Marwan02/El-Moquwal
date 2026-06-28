const mongoose = require('mongoose');
const argon2 = require('argon2');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../src/config/db');
const SuperAdminProfile = require('../src/models/SuperAdminProfile');

function hashNID(nid) {
  return crypto.createHash('sha256').update(nid).digest('hex');
}

async function injectAdmin() {
  try {
    await connectDB();
    const passwordHash = await argon2.hash('123456');
    
    // Check if user already exists
    const existing = await SuperAdminProfile.findOne({ email: 'admin@admin.com' });
    if (existing) {
      console.log('Admin user already exists. Updating password...');
      existing.passwordHash = passwordHash;
      await existing.save();
      console.log('Admin user password updated.');
      process.exit(0);
    }

    const admin = await SuperAdminProfile.create({
      name: 'Admin',
      email: 'admin@admin.com',
      phone: '01000000000', // Dummy phone
      passwordHash,
      status: 'active',
      isEmailVerified: true,
      nationalIdHash: hashNID('29900000000000'), // Dummy NID
      nationalIdLast4: '0000',
    });

    console.log('Admin user successfully injected with ID:', admin._id);
    process.exit(0);
  } catch (err) {
    console.error('Failed to inject admin user:', err);
    process.exit(1);
  }
}

injectAdmin();
