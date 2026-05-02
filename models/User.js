const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    isPhoneVerified: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: true },

    name: { type: String, required: true, trim: true },
    aadhaar: { type: String, unique: true, sparse: true, trim: true },
    address: { type: String, required: true, trim: true },

    pin: { type: String, required: true },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    confidence: Number,
    grid: { type: String, required: true },
    digipin: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);