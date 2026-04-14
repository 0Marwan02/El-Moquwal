const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Admin = require('../src/models/AdminProfile');
const User = require('../src/models/User'); // if inherited
const { hashPassword } = require('../src/utils/password');
require('dotenv').config();

async function main() {
  try {
    await connectDB();
    const admin = await Admin.findOne({ email: 'admin@admin.com' }) || await User.findOne({ email: 'admin@admin.com' });
    if (!admin) {
      console.log('Admin not found in DB!');
      process.exit(1);
    }
    admin.passwordHash = await hashPassword('123456');
    await admin.save();
    console.log('Admin password successfully updated to 123456.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  }
}
main();
