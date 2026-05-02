const TempUser = require("../models/TempUser");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendOTP = require("../utils/sendOTP");
const sendEmailOtpUtil = require("../utils/sendEmailOtp");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRY_MINUTES = 5;
const OTP_COOLDOWN_SECONDS = 30;
const MAX_OTP_ATTEMPTS = 5;

const makeExpiry = () =>
  new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

const makeCooldown = () =>
  new Date(Date.now() + OTP_COOLDOWN_SECONDS * 1000);
/* ---------------- PHONE OTP ---------------- */

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone required" });
    }

    let tempUser = await TempUser.findOne({ phone });

    if (tempUser?.phoneOtpResendAfter && tempUser.phoneOtpResendAfter > new Date()) {
      const waitSeconds = Math.ceil((tempUser.phoneOtpResendAfter - new Date()) / 1000);
      return res.status(429).json({
        error: `Wait ${waitSeconds} seconds before requesting another OTP`,
      });
    }

    const otp = generateOtp();

    if (!tempUser) {
      tempUser = await TempUser.create({
        phone,
        otp,
        otpExpiry: makeExpiry(),
        phoneOtpResendAfter: makeCooldown(),
        phoneOtpAttempts: 0,
        isPhoneVerified: false,
        stage: "OTP_SENT",
      });
    } else {
      tempUser.otp = otp;
      tempUser.otpExpiry = makeExpiry();
      tempUser.phoneOtpResendAfter = makeCooldown();
      tempUser.phoneOtpAttempts = 0;
      tempUser.isPhoneVerified = false;
      tempUser.stage = "OTP_SENT";
      await tempUser.save();
    }

    await sendOTP(phone, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP required" });
    }

    const tempUser = await TempUser.findOne({ phone });

    if (!tempUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (tempUser.phoneOtpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        error: "Too many wrong attempts. Request a new OTP.",
      });
    }

    if (!tempUser.otpExpiry || tempUser.otpExpiry < new Date()) {
      return res.status(400).json({ error: "OTP expired. Request a new OTP." });
    }

    if (tempUser.otp !== otp) {
      tempUser.phoneOtpAttempts += 1;
      await tempUser.save();

      return res.status(400).json({
        error: `Invalid OTP. Attempts left: ${
          MAX_OTP_ATTEMPTS - tempUser.phoneOtpAttempts
        }`,
      });
    }

    tempUser.isPhoneVerified = true;
    tempUser.otp = undefined;
    tempUser.otpExpiry = undefined;
    tempUser.phoneOtpAttempts = 0;
    tempUser.stage = "PHONE_VERIFIED";

    await tempUser.save();

    res.json({
      message: "Phone verified",
      tempUserId: tempUser._id,
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- EMAIL OTP ---------------- */

exports.sendEmailOtp = async (req, res) => {
  try {
    const { tempUserId, email } = req.body;

    if (!tempUserId || !email) {
      return res.status(400).json({ error: "tempUserId and email required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Enter a valid email" });
    }

    const tempUser = await TempUser.findById(tempUserId);

    if (!tempUser) {
      return res.status(404).json({ error: "Temp user not found" });
    }

    if (!tempUser.isPhoneVerified) {
      return res.status(400).json({ error: "Phone not verified" });
    }

    if (tempUser.emailOtpResendAfter && tempUser.emailOtpResendAfter > new Date()) {
      const waitSeconds = Math.ceil((tempUser.emailOtpResendAfter - new Date()) / 1000);
      return res.status(429).json({
        error: `Wait ${waitSeconds} seconds before requesting another email OTP`,
      });
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const otp = generateOtp();

    tempUser.email = cleanEmail;
    tempUser.emailOtp = otp;
    tempUser.emailOtpExpiry = makeExpiry();
    tempUser.emailOtpResendAfter = makeCooldown();
    tempUser.emailOtpAttempts = 0;
    tempUser.isEmailVerified = false;
    tempUser.stage = "EMAIL_OTP_SENT";

    await tempUser.save();

    await sendEmailOtpUtil(cleanEmail, otp);

    res.json({ message: "Email OTP sent successfully" });
  } catch (err) {
    console.error("SEND EMAIL OTP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const { tempUserId, otp } = req.body;

    if (!tempUserId || !otp) {
      return res.status(400).json({ error: "tempUserId and OTP required" });
    }

    const tempUser = await TempUser.findById(tempUserId);

    if (!tempUser) {
      return res.status(404).json({ error: "Temp user not found" });
    }

    if (tempUser.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        error: "Too many wrong attempts. Request a new email OTP.",
      });
    }

    if (!tempUser.emailOtp) {
      return res.status(400).json({ error: "Send email OTP first" });
    }

    if (!tempUser.emailOtpExpiry || tempUser.emailOtpExpiry < new Date()) {
      return res.status(400).json({ error: "Email OTP expired. Request again." });
    }

    if (tempUser.emailOtp !== otp) {
      tempUser.emailOtpAttempts += 1;
      await tempUser.save();

      return res.status(400).json({
        error: `Invalid email OTP. Attempts left: ${
          MAX_OTP_ATTEMPTS - tempUser.emailOtpAttempts
        }`,
      });
    }

    tempUser.isEmailVerified = true;
    tempUser.emailOtp = undefined;
    tempUser.emailOtpExpiry = undefined;
    tempUser.emailOtpAttempts = 0;
    tempUser.stage = "EMAIL_VERIFIED";

    await tempUser.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("VERIFY EMAIL OTP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
/* ---------------- LOGIN ---------------- */

exports.loginWithPin = async (req, res) => {
  try {
    const { identifier, pin } = req.body;

    if (!identifier || !pin) {
      return res.status(400).json({ error: "Phone/email and PIN required" });
    }

    const user = await User.findOne({
      $or: [{ phone: identifier }, { email: identifier.toLowerCase() }],
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(429).json({
        error: "Account locked. Try again later.",
      });
    }

    const match = await bcrypt.compare(pin, user.pin);

    if (!match) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        return res.status(429).json({
          error: "Too many wrong PIN attempts. Locked for 15 minutes.",
        });
      }

      await user.save();

      return res.status(401).json({
        error: `Invalid PIN. Attempts left: ${5 - user.loginAttempts}`,
      });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.json({
      message: "Login success",
      digipin: user.digipin,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};