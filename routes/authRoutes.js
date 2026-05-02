const express = require("express");
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
  loginWithPin,
} = require("../controllers/authController");

const { otpLimiter, loginLimiter } = require("../middleware/rateLimiter");

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/send-email-otp", otpLimiter, sendEmailOtp);
router.post("/verify-email-otp", otpLimiter, verifyEmailOtp);
router.post("/login", loginLimiter, loginWithPin);

module.exports = router;