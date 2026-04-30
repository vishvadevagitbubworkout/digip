const haversine = require("./distance");

// average lat/lon
const getAverage = (points) => {
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lon: points.reduce((s, p) => s + p.lon, 0) / points.length
  };
};

// maximum distance between any two points
const calculateSpread = (points) => {
  let maxDist = 0;

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = haversine(
        points[i].lat,
        points[i].lon,
        points[j].lat,
        points[j].lon
      );

      if (d > maxDist) maxDist = d;
    }
  }

  return maxDist;
};

// remove points far from average
const removeOutliers = (points, maxDistance = 25) => {
  const avg = getAverage(points);

  return points.filter((p) => {
    const d = haversine(p.lat, p.lon, avg.lat, avg.lon);
    return d <= maxDistance;
  });
};

// find dense cluster
const getCluster = (points, radius = 12) => {
  let bestCluster = [];

  for (let p1 of points) {
    const nearby = points.filter((p2) => {
      return haversine(p1.lat, p1.lon, p2.lat, p2.lon) <= radius;
    });

    if (nearby.length > bestCluster.length) {
      bestCluster = nearby;
    }
  }

  return bestCluster;
};

// convert lat/lon to meters
const toMeters = (lat, lon) => {
  const latM = lat * 111320;
  const lonM = lon * 111320 * Math.cos(lat * Math.PI / 180);

  return {
    x: lonM,
    y: latM
  };
};

// convert meters back to lat/lon
const toLatLon = (x, y) => {
  const lat = y / 111320;
  const lon = x / (111320 * Math.cos(lat * Math.PI / 180));

  return { lat, lon };
};

const calibrateLocation = (samples) => {
  if (!samples || samples.length < 10) {
    return {
      error: "Minimum 10 samples required",
      retry: true
    };
  }

  // 1. raw spread check
  const rawSpread = calculateSpread(samples);

  if (rawSpread > 80) {
    return {
      error: "GPS signal highly unstable",
      spread: rawSpread,
      retry: true
    };
  }

  // 2. remove outliers
  const filtered = removeOutliers(samples, 25);

  if (filtered.length < 6) {
    return {
      error: "Too many GPS outliers",
      spread: rawSpread,
      retry: true
    };
  }

  // 3. filtered spread check
  const filteredSpread = calculateSpread(filtered);

  if (filteredSpread > 40) {
    return {
      error: "GPS variation still high after filtering",
      spread: filteredSpread,
      retry: true
    };
  }

  // 4. get stable cluster
  const cluster = getCluster(filtered, 12);

  if (cluster.length < Math.ceil(samples.length * 0.6)) {
    return {
      error: "No stable GPS cluster",
      spread: filteredSpread,
      retry: true
    };
  }

  // 5. grid voting
  const gridVotes = {};
  const cellSize = 5;

  cluster.forEach((p) => {
    const { x, y } = toMeters(p.lat, p.lon);

    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);

    const key = `${gx}-${gy}`;
    gridVotes[key] = (gridVotes[key] || 0) + 1;
  });

  let bestGrid = null;
  let maxVotes = 0;

  for (let key in gridVotes) {
    if (gridVotes[key] > maxVotes) {
      maxVotes = gridVotes[key];
      bestGrid = key;
    }
  }

  if (!bestGrid) {
    return {
      error: "Grid resolution failed",
      retry: true
    };
  }

  // 6. confidence check
  const confidence = maxVotes / cluster.length;

  if (confidence < 0.65) {
    return {
      error: "Low grid confidence",
      confidence,
      grid: bestGrid,
      spread: filteredSpread,
      retry: true
    };
  }

  // 7. grid center
  const [gx, gy] = bestGrid.split("-").map(Number);

  const centerX = gx * cellSize + cellSize / 2;
  const centerY = gy * cellSize + cellSize / 2;

  const { lat, lon } = toLatLon(centerX, centerY);

  return {
    lat,
    lon,
    confidence,
    grid: bestGrid,
    spread: filteredSpread,
    samplesUsed: cluster.length,
    retry: false
  };
};

module.exports = calibrateLocation;