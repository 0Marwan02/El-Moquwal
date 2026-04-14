// el guest session — 3ashan el user el mesh m3amel 7esab lessa ne3rafo
const mongoose = require('mongoose');

const guestSessionSchema = new mongoose.Schema(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    // metadata 5afifa — ma nsgelsh fingerprint detail
    userAgent: { type: String, default: null },
    lastSeenAt: { type: Date, default: Date.now },
    visits: { type: Number, default: 1 },
    // el guest byetconvert le user real 3ashan el analytics
    convertedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// TTL index — el guest sessions el mesh mst3mla tetmesa7 ba3d 30 youm
guestSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('GuestSession', guestSessionSchema);
