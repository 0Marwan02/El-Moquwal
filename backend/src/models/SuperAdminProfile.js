// SuperAdminProfile discriminator
const mongoose = require('mongoose');
const User = require('./User');

const superAdminSchema = new mongoose.Schema({});

const SuperAdmin = User.discriminator('super_admin', superAdminSchema);

module.exports = SuperAdmin;
