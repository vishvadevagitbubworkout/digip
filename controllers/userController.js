const TempUser = require("../models/TempUser");

// SAVE USER DETAILS (NAME + AADHAAR)
exports.saveUserDetails = async (req, res) => {
    try {
        const { tempUserId, name, aadhaar } = req.body;

        if (!tempUserId || !name || !aadhaar) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

        const tempUser = await TempUser.findById(tempUserId);

        if (!tempUser) {
            return res.status(404).json({
                error: "Temp user not found"
            });
        }

        tempUser.name = name;
        tempUser.aadhaar = aadhaar;
        tempUser.stage = "DETAILS_DONE";

        await tempUser.save();

        return res.json({
            message: "User details saved",
            tempUserId: tempUser._id
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
};