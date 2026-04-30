const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const TempUser = require("../models/TempUser");
const User = require("../models/User");

/* -------- SAVE DETAILS -------- */

router.post("/details", async (req, res) => {
  try {
    const { tempUserId, name, aadhaar, address } = req.body;

    if (!tempUserId || !name || !aadhaar || !address) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const tempUser = await TempUser.findById(tempUserId);

    if (!tempUser || !tempUser.isPhoneVerified || !tempUser.isEmailVerified) {
      return res.status(400).json({ error: "Verification incomplete" });
    }

    tempUser.name = name;
    tempUser.aadhaar = aadhaar;
    tempUser.address = address;

    await tempUser.save();

    res.json({ message: "Details saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------- CREATE ACCOUNT -------- */

router.post("/create-account", async (req, res) => {
  try {
    const { tempUserId, pin } = req.body;

    if (!tempUserId || !pin) {
      return res.status(400).json({ error: "Missing data" });
    }

    if (!/^[0-9]{5}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be 5 digits" });
    }

    const tempUser = await TempUser.findById(tempUserId);

    if (!tempUser || !tempUser.isPhoneVerified || !tempUser.isEmailVerified) {
      return res.status(400).json({ error: "Verification incomplete" });
    }

    if (!tempUser.lat || !tempUser.digipin) {
      return res.status(400).json({ error: "Location not done" });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await User.create({
      phone: tempUser.phone,
      email: tempUser.email,
      name: tempUser.name,
      aadhaar: tempUser.aadhaar,
      address: tempUser.address,
      pin: hashedPin,
      lat: tempUser.lat,
      lon: tempUser.lon,
      confidence: tempUser.confidence,
      grid: tempUser.grid,
      digipin: tempUser.digipin,
    });

    await TempUser.findByIdAndDelete(tempUserId);

    res.json({
      message: "Account created",
      digipin: user.digipin,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;