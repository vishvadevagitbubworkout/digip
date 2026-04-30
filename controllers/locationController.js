function distance(a, b) {
    return Math.sqrt(
        Math.pow(a.lat - b.lat, 2) +
        Math.pow(a.lon - b.lon, 2)
    );
}

// CALIBRATION
exports.calibrate = (req, res) => {
    const { samples } = req.body;

    if (!samples || samples.length < 5) {
        return res.status(400).json({ error: "Need more samples" });
    }

    let sumLat = 0, sumLon = 0;

    samples.forEach(s => {
        sumLat += s.lat;
        sumLon += s.lon;
    });

    const lat = sumLat / samples.length;
    const lon = sumLon / samples.length;

    let variance = 0;

    samples.forEach(s => {
        variance += distance(s, { lat, lon });
    });

    variance = variance / samples.length;

    const confidence = Math.max(0, 1 - variance * 1000);

    res.json({
        lat,
        lon,
        confidence
    });
};