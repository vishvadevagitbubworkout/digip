const TempUser = require("../models/TempUser");

// CREATE SESSION AFTER OTP
exports.createTempSession = async (req, res) => {
    const { phone } = req.body;

    let tempUser = await TempUser.findOne({ phone });

    if (!tempUser) {
        tempUser = await TempUser.create({
            phone,
            isPhoneVerified: true
        });
    }

    res.json({
        message: "Temp session created",
        tempUserId: tempUser._id
    });
};