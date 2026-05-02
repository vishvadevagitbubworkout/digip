const OTP_EXPIRY_MINUTES = 5;
const OTP_COOLDOWN_SECONDS = 30;
const MAX_OTP_ATTEMPTS = 5;

const makeExpiry = () => new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
const makeCooldown = () => new Date(Date.now() + OTP_COOLDOWN_SECONDS * 1000);
const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true },
    otp: String,
    otpExpiry: Date,
    isPhoneVerified: { type: Boolean, default: false },

    phoneOtpAttempts: { type: Number, default: 0 },
    phoneOtpResendAfter: Date,

    email: { type: String, lowercase: true, trim: true },
    emailOtp: String,
    emailOtpExpiry: Date,
    isEmailVerified: { type: Boolean, default: false },

    emailOtpAttempts: { type: Number, default: 0 },
    emailOtpResendAfter: Date,

    name: String,
    aadhaar: String,
    address: String,

    lat: Number,
    lon: Number,
    confidence: Number,
    grid: String,
    digipin: String,

    stage: { type: String, default: "PHONE_ENTERED" },
  },
  { timestamps: true }
);

// Auto-delete temp users after 30 minutes
tempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

module.exports =
  mongoose.models.TempUser || mongoose.model("TempUser", tempUserSchema);