const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const TempUser = require("../models/TempUser");

const toRad = (x) => (x * Math.PI) / 180;

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const average = (points) => ({
  lat: points.reduce((s, p) => s + Number(p.lat), 0) / points.length,
  lon: points.reduce((s, p) => s + Number(p.lon), 0) / points.length,
});

const makeGridAndPin = (lat, lon) => {
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(toRad(lat));
  const gridLat = Math.floor((lat * metersPerDegLat) / 5);
  const gridLon = Math.floor((lon * metersPerDegLon) / 5);
  const grid = `${gridLat}:${gridLon}`;
  const hash = crypto.createHash("sha256").update(grid).digest("hex");
  const digipin = BigInt("0x" + hash.slice(0, 12)).toString(36).toUpperCase().padStart(10, "0").slice(0, 10);
  return { grid, digipin };
};

router.post("/resolve", async (req, res) => {
  try {
    const { userId, tempUserId, samples } = req.body;
    const id = userId || tempUserId;

    if (!id) return res.status(400).json({ error: "tempUserId is required" });
    if (!Array.isArray(samples) || samples.length < 3) return res.status(400).json({ error: "At least 3 GPS samples required" });

    const clean = samples
      .map((p) => ({ lat: Number(p.lat), lon: Number(p.lon) }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

    if (clean.length < 3) return res.status(400).json({ error: "Valid GPS samples required" });

    const avg1 = average(clean);
    const filtered = clean.filter((p) => haversine(p.lat, p.lon, avg1.lat, avg1.lon) <= 25);
    const finalPoints = filtered.length >= 3 ? filtered : clean;
    const avg2 = average(finalPoints);

    const distances = finalPoints.map((p) => haversine(p.lat, p.lon, avg2.lat, avg2.lon));
    const confidence = distances.reduce((s, d) => s + d, 0) / distances.length;
    const { grid, digipin } = makeGridAndPin(avg2.lat, avg2.lon);

    const tempUser = await TempUser.findById(id);
    if (!tempUser) return res.status(404).json({ error: "Temp user not found" });
    if (!tempUser.isPhoneVerified) return res.status(400).json({ error: "Phone not verified" });

    tempUser.lat = avg2.lat;
    tempUser.lon = avg2.lon;
    tempUser.confidence = confidence;
    tempUser.grid = grid;
    tempUser.digipin = digipin;
    tempUser.stage = "LOCATION_DONE";
    await tempUser.save();

    res.json({ lat: avg2.lat, lon: avg2.lon, confidence, grid, digipin });
  } catch (err) {
    console.error("LOCATION RESOLVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
