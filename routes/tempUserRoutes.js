const express = require("express");
const router = express.Router();

const TempUser = require("../models/TempUser");

router.post("/create-session", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number required" });
    }

    const user = await TempUser.create({
      phone,
      isPhoneVerified: true,
      stage: "OTP_VERIFIED"
    });

    res.json({
      message: "Temp session created",
      tempUserId: user._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;