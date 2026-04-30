const TempUser = require("../models/TempUser");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendOTP = require("../utils/sendOTP");
const sendEmailOtpUtil = require("../utils/sendEmailOtp");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ---------------- PHONE OTP ---------------- */

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let tempUser = await TempUser.findOne({ phone });

    if (!tempUser) {
      tempUser = await TempUser.create({
        phone,
        otp,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
        isPhoneVerified: false,
        stage: "OTP_SENT",
      });
    } else {
      tempUser.otp = otp;
      tempUser.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
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

    if (tempUser.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (!tempUser.otpExpiry || tempUser.otpExpiry < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    tempUser.isPhoneVerified = true;
    tempUser.otp = undefined;
    tempUser.otpExpiry = undefined;
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

    const otp = generateOtp();

    const tempUser = await TempUser.findById(tempUserId);

    if (!tempUser) {
      return res.status(404).json({ error: "Temp user not found" });
    }

    if (!tempUser.isPhoneVerified) {
      return res.status(400).json({ error: "Phone not verified" });
    }

    tempUser.email = cleanEmail;
    tempUser.emailOtp = otp;
    tempUser.emailOtpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    tempUser.isEmailVerified = false;

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

    if (!tempUser.emailOtp) {
      return res.status(400).json({ error: "Send email OTP first" });
    }

    if (tempUser.emailOtp !== otp) {
      return res.status(400).json({ error: "Invalid email OTP" });
    }

    if (!tempUser.emailOtpExpiry || tempUser.emailOtpExpiry < new Date()) {
      return res.status(400).json({ error: "Email OTP expired" });
    }

    tempUser.isEmailVerified = true;
    tempUser.emailOtp = undefined;
    tempUser.emailOtpExpiry = undefined;

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
      return res.status(400).json({ error: "Missing credentials" });
    }

    const user = await User.findOne({
      $or: [{ phone: identifier }, { email: identifier }],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await bcrypt.compare(pin, user.pin);

    if (!match) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    res.json({
      message: "Login success",
      digipin: user.digipin,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};