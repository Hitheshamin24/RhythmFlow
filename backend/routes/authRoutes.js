const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Studio = require("../models/Studio");
const transporter = require("../utils/mailer");

const router = express.Router();

/* ======================================================
   REGISTER
====================================================== */
router.post("/register", async (req, res) => {
  try {
    const { className, email, password, phone } = req.body;

    if (!className || !email || !password || !phone) {
      return res.status(400).json({
        message: "className, email, phone and password are required",
      });
    }

    let studio = await Studio.findOne({ className });

    // ❌ Already verified studio
    if (studio && studio.emailVerified) {
      return res
        .status(400)
        .json({ message: "Dance class name already registered" });
    }

    // 🔁 Update unverified studio
    if (studio && !studio.emailVerified) {
      studio.email = email.toLowerCase().trim();
      studio.phone = phone.trim();
      studio.password = await bcrypt.hash(password, 10);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      studio.emailVerificationOtp = otp;
      studio.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await studio.save();

      res.json({
        message: "OTP sent. Please verify your email.",
        studio: {
          id: studio._id,
          className: studio.className,
          email: studio.email,
          phone: studio.phone,
          emailVerified: studio.emailVerified,
        },
      });

      // 🔥 NON-BLOCKING EMAIL
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: studio.email,
        subject: "RhythmFlow Email Verification OTP",
        text: `Your OTP is ${otp}. Valid for 10 minutes.`,
      }).catch(console.error);

      return;
    }

    // ✅ New studio
    const hashed = await bcrypt.hash(password, 10);

    studio = await Studio.create({
      className,
      email,
      phone,
      password: hashed,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    studio.emailVerificationOtp = otp;
    studio.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await studio.save();

    res.status(201).json({
      message: "Registered successfully. OTP sent to email.",
      studio: {
        id: studio._id,
        className: studio.className,
        email: studio.email,
        phone: studio.phone,
        emailVerified: studio.emailVerified,
      },
    });

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: studio.email,
      subject: "RhythmFlow Email Verification OTP",
      text: `Your OTP is ${otp}. Valid for 10 minutes.`,
    }).catch(console.error);

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================================================
   LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { className, password } = req.body;

    if (!className || !password) {
      return res.status(400).json({
        message: "ClassName and password are required",
      });
    }

    const studio = await Studio.findOne({ className });
    if (!studio) {
      return res.status(400).json({ message: "Dance class not found" });
    }

    const isMatch = await bcrypt.compare(password, studio.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 🟡 Email not verified
    if (!studio.emailVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      studio.emailVerificationOtp = otp;
      studio.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await studio.save();

      res.json({
        requiresVerification: true,
        message: "Email not verified. OTP sent.",
        studio: {
          id: studio._id,
          className: studio.className,
          email: studio.email,
          phone: studio.phone,
          emailVerified: studio.emailVerified,
        },
      });

      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: studio.email,
        subject: "RhythmFlow Email Verification OTP",
        text: `Your OTP is ${otp}. Valid for 10 minutes.`,
      }).catch(console.error);

      return;
    }

    // ✅ Normal login
    const token = jwt.sign(
      { studioId: studio._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      studio: {
        id: studio._id,
        className: studio.className,
        email: studio.email,
        phone: studio.phone,
        emailVerified: studio.emailVerified,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================================================
   FORGOT PASSWORD (EMAIL ONLY)
====================================================== */
router.post("/forgot-password", async (req, res) => {
  try {
    const { className, email } = req.body;

    const studio = await Studio.findOne(
      className ? { className } : { email }
    );

    if (!studio) {
      return res.status(400).json({ message: "Account not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    studio.resetOtp = otp;
    studio.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await studio.save();

    res.json({
      message: "Password reset OTP sent to your email.",
    });

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: studio.email,
      subject: "RhythmFlow Password Reset OTP",
      text: `Your OTP is ${otp}. Valid for 10 minutes.`,
    }).catch(console.error);

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================================================
   RESET PASSWORD
====================================================== */
router.post("/reset-password-otp", async (req, res) => {
  try {
    const { className, email, otp, newPassword } = req.body;

    const studio = await Studio.findOne(
      className ? { className } : { email }
    );

    if (
      !studio ||
      !studio.resetOtp ||
      studio.resetOtp !== otp ||
      studio.resetOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    studio.password = await bcrypt.hash(newPassword, 10);
    studio.resetOtp = undefined;
    studio.resetOtpExpires = undefined;
    await studio.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================================================
   VERIFY EMAIL
====================================================== */
router.post("/verify-email", async (req, res) => {
  try {
    const { className, email, otp } = req.body;

    const studio = await Studio.findOne(
      className ? { className } : { email }
    );

    if (
      !studio ||
      studio.emailVerificationOtp !== otp ||
      studio.emailVerificationOtpExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    studio.emailVerified = true;
    studio.emailVerificationOtp = undefined;
    studio.emailVerificationOtpExpires = undefined;
    await studio.save();

    const token = jwt.sign(
      { studioId: studio._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Email verified successfully",
      token,
      studio: {
        id: studio._id,
        className: studio.className,
        email: studio.email,
        phone: studio.phone,
        emailVerified: studio.emailVerified,
      },
    });
  } catch (err) {
    console.error("Verify Email Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
