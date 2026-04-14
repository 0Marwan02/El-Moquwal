const mongoose = require('mongoose');
const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const Admin = require('../src/models/AdminProfile');
const User = require('../src/models/User');
const { hashPassword } = require('../src/utils/password');

async function main() {
  try {
    await connectDB();
    const email = 'admin@admin.com';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin already exists.');
      process.exit(0);
    }
    const passwordHash = await hashPassword('Admin@123');
    const admin = await Admin.create({
      name: 'Super Admin',
      email: email,
      phone: '01000000000',
      passwordHash,
      status: 'active',
    });
    console.log('Admin created!', admin.email);
  } catch (err) {
    console.error('Error seeding:', err);
    process.exit(1);
  } finally {
    mongoose.disconnect();
  }
}
main();
