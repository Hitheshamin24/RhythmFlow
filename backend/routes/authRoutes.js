const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Studio = require("../models/Studio");
const transporter = require("../utils/mailer");
const { sendSms } = require("../utils/smsService");

const router = express.Router();

const nodemailer = require("nodemailer");
// POST /api/auth/register
// body:{classname,email,password}
router.post("/register", async (req, res) => {
  try {
    const { className, email, password, phone } = req.body;

    if (!className || !password) {
      return res
        .status(400)
        .json({ message: "className and password are required" });
    }

    const existing = await Studio.findOne({ className });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Dance class name already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const studio = await Studio.create({
      className,
      email,
      phone, // 👈 save phone
      password: hashed,
    });

    // ✅ fixed
    const token = jwt.sign({ studioId: studio._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      studio: {
        id: studio._id,
        className: studio.className,
        email: studio.email,
        phone: studio.phone, // 👈 include phone in response if you like
      },
    });
  } catch (e) {
    console.error("Register Error", e);
    res.status(500).json({ message: "Server Error" });
  }
});

//   POST /api/auth/login
// body{className,password}
router.post("/login", async (req, res) => {
  try {
    const { className, password } = req.body;
    if (!className || !password) {
      return res
        .status(400)
        .json({ message: "ClassName and password are required" });
    }
    const studio = await Studio.findOne({ className });
    if (!studio) {
      return res.status(400).json({ message: "Dance class Not found" });
    }
    const isMatch = await bcrypt.compare(password, studio.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }
    // ✅ fixed
    const token = jwt.sign({ studioId: studio._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      studio: {
        id: studio._id,
        className: studio.className,
        email: studio.email,
      },
    });
  } catch (err) {
    console.error("Login Error", err);
    res.status(500).json({ message: "Sever error" });
  }
});

// POST /api/auth/forgot-password
// body: { className?, email?, phone? }  --> at least ONE required
router.post("/forgot-password", async (req, res) => {
  try {
    const { className, email, phone } = req.body;

    if (!className && !email && !phone) {
      return res
        .status(400)
        .json({ message: "Provide className or email or phone" });
    }

    let studio;

    if (className) {
      studio = await Studio.findOne({ className });
    } else if (email) {
      studio = await Studio.findOne({ email });
    } else if (phone) {
      studio = await Studio.findOne({ phone });
    }

    if (!studio) {
      return res
        .status(400)
        .json({ message: "No account found for given details" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP + expiry 10 mins from now
    studio.resetOtp = otp;
    studio.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await studio.save();

    const message = `Your RhythmFlow password reset OTP is: ${otp}. It is valid for 10 minutes.`;

    // 📧 Send Email (to the email stored in Studio)
    if (studio.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: studio.email,
        subject: "RhythmFlow Password Reset OTP",
        text: message,
      });
    }

    // 📱 Send SMS (to the phone stored in Studio)
    if (studio.phone) {
      await sendSms(studio.phone, message);
    }

    return res.json({
      message:
        "OTP sent to your registered email and phone (if available). Valid for 10 minutes.",
    });
  } catch (e) {
    console.error("Forgot password error", e);
    res.status(500).json({ message: "Server error" });
  }
});
// POST /api/auth/reset-password-otp
// body: { className?, email?, phone?, otp, newPassword }
router.post("/reset-password-otp", async (req, res) => {
  try {
    const { className, email, phone, otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "OTP and newPassword are required" });
    }

    if (!className && !email && !phone) {
      return res
        .status(400)
        .json({ message: "Provide className or email or phone" });
    }

    let studio;
    if (className) {
      studio = await Studio.findOne({ className });
    } else if (email) {
      studio = await Studio.findOne({ email });
    } else if (phone) {
      studio = await Studio.findOne({ phone });
    }

    if (!studio || !studio.resetOtp || !studio.resetOtpExpires) {
      return res
        .status(400)
        .json({ message: "No OTP request found for this account" });
    }

    if (studio.resetOtpExpires < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (studio.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 10);
    studio.password = hashed;
    studio.resetOtp = undefined;
    studio.resetOtpExpires = undefined;

    await studio.save();

    res.json({ message: "Password has been reset successfully." });
  } catch (e) {
    console.error("Reset password with OTP error", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
