const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true },
    otp: String,
    otpExpiry: Date,
    isPhoneVerified: { type: Boolean, default: false },

    email: { type: String, lowercase: true, trim: true },
    emailOtp: String,
    emailOtpExpiry: Date,
    isEmailVerified: { type: Boolean, default: false },

    name: { type: String, trim: true },
    aadhaar: { type: String, trim: true },
    address: { type: String, trim: true },

    lat: Number,
    lon: Number,
    confidence: Number,
    grid: { type: String, index: true },
    digipin: { type: String, index: true, trim: true },

    stage: { type: String, default: "PHONE_ENTERED" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.TempUser || mongoose.model("TempUser", tempUserSchema);
