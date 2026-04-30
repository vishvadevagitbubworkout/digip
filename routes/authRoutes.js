const express = require("express");
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
  loginWithPin,
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/login", loginWithPin);

module.exports = router;