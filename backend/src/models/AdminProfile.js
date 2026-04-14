// el discriminator bta3 el admin — basic schema bdoon haga zyada
const mongoose = require('mongoose');
const User = require('./User');

// el admin schema — feeh permissions ashr3 fel mosta2bal
const adminSchema = new mongoose.Schema({
  // el permissions el specific lel admin (momken n3mel roles tanya fel mosta2bal)
  permissions: {
    type: [String],
    default: ['review_projects', 'approve_contractors', 'manage_users'],
  },
});

const Admin = User.discriminator('admin', adminSchema);

module.exports = Admin;
