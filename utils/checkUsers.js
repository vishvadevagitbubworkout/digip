const mongoose = require("mongoose");
const User = require("../models/User");

require("dotenv").config({ path: __dirname + "/../.env" });

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    const users = await User.find({});
    console.log("Users in DB:", users);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
