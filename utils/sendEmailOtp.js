require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmailOtp = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "DigiPIN Email Verification OTP",
      text: `Your DigiPIN email verification OTP is ${otp}. It is valid for 5 minutes.`
    });

    console.log("EMAIL SENT:", info.messageId);
    return info;

  } catch (err) {
    console.error("EMAIL SEND ERROR:", err);
    throw err;
  }
};

module.exports = sendEmailOtp;