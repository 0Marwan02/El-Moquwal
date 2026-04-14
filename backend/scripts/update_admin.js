// one-time script — upsert admin@admin.com with password 123456ABC
// run: node backend/scripts/update_admin.js

const crypto = require('crypto');
const mongoose = require('mongoose');

const { connectDB } = require('../src/config/db');
const Admin = require('../src/models/AdminProfile');
const User  = require('../src/models/User');
const { hashPassword } = require('../src/utils/password');

const ADMIN_EMAIL    = 'admin@admin.co';
const ADMIN_PASSWORD = '123456ABC';
const ADMIN_NAME     = 'مدير النظام';
const ADMIN_PHONE    = '01000000000';

async function main() {
  console.log('\n=== update_admin.js — El Moquwal ===\n');
  try {
    await connectDB();

    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    const dummyNID     = '00000000000099';
    const nidHash      = crypto.createHash('sha256').update(dummyNID).digest('hex');

    // check if an admin with this email already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      // update password + patch any missing required fields
      existing.passwordHash    = passwordHash;
      existing.status          = 'active';
      if (!existing.nationalIdLast4) existing.nationalIdLast4 = '0000';
      if (!existing.nationalIdHash)  existing.nationalIdHash  = nidHash;
      await existing.save();
      console.log('✅ Admin password updated:');
      console.log(`   ID:    ${existing._id}`);
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role:  ${existing.role}`);
    } else {
      const admin = await Admin.create({
        name:           ADMIN_NAME,
        email:          ADMIN_EMAIL,
        phone:          ADMIN_PHONE,
        passwordHash,
        nationalIdHash: nidHash,
        nationalIdLast4: '0099',
        status:         'active',
      });
      console.log('✅ Admin created:');
      console.log(`   ID:    ${admin._id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role:  ${admin.role}`);
    }

    console.log(`\n   Credentials: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}\n`);
  } catch (err) {
    console.error('\n❌ Error:', err.message || err, '\n');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
