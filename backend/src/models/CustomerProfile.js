// el discriminator bta3 el customer — el fields el makhasa beh (NID, mo7afza, ..)
const mongoose = require('mongoose');
const User = require('./User');

// el customer specific schema
const customerSchema = new mongoose.Schema({
  // el data el mestkhraga men el NID
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  governorate: { type: String, required: true },
  governorateCode: { type: String, required: true, maxlength: 2 },
});

// byraga3 el Customer model ka discriminator 3ala el User el asasy
const Customer = User.discriminator('customer', customerSchema);

module.exports = Customer;
