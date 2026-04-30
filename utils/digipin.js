const crypto = require("crypto");

const generateDigiPin = (grid) => {
    const hash = crypto
        .createHash("sha256")
        .update(grid)
        .digest("hex");

    return parseInt(hash.slice(0, 12), 16)
        .toString(36)
        .toUpperCase();
};

module.exports = generateDigiPin;