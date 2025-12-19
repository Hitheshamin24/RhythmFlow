const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Studio = require("../models/Studio");
const sendEmail = require("../utils/mailer");

const router = express.Router();

const nodemailer = require("nodemailer");
// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { className, email, password, phone } = req.body;

    if (!className || !password || !email || !phone) {
      return res.status(400).json({
        message: "className, email, phone and password are required",
      });
    }

    // 1) Check if a studio with this className already exists
    let studio = await Studio.findOne({ className });

    // ✅ CASE A: Studio exists and is ALREADY VERIFIED → block
    if (studio && studio.emailVerified) {
      return res
        .status(400)
        .json({ message: "Dance class name already registered" });
    }

    // ✅ CASE B: Studio exists but is NOT verified yet → allow "correction"
    if (studio && !studio.emailVerified) {
      // Make sure the new email/phone are not used by some OTHER studio
      const existingByEmail = await Studio.findOne({
        email,
        _id: { $ne: studio._id },
      });
      if (existingByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const existingByPhone = await Studio.findOne({
        phone,
        _id: { $ne: studio._id },
      });
      if (existingByPhone) {
        return res.status(400).json({ message: "Phone already registered" });
      }

      // Update fields (correcting the registration)
      studio.email = email.toLowerCase().trim();
      studio.phone = phone.trim();
      studio.password = await bcrypt.hash(password, 10);

      // Generate new email verification OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      studio.emailVerificationOtp = otp;
      studio.emailVerificationOtpExpires = new Date(
        Date.now() + 10 * 60 * 1000
      ); // 10 min

      await studio.save();

      const message = `Your RhythmFlow email verification OTP is: ${otp}. It is valid for 10 minutes.`;
      await sendEmail({
        to: studio.email,
        subject: "RhythmFlow Email Verification OTP",
        text: message,
      });

      return res.status(200).json({
        message:
          "Existing unverified studio updated. Please verify with the new OTP.",
        studio: {
          id: studio._id,
          className: studio.className,
          email: studio.email,
          phone: studio.phone,
          emailVerified: studio.emailVerified,
        },
      });
    }

    // ✅ CASE C: No studio with this className yet → normal fresh registration

    // Check duplicates by email/phone
    const existingByEmail = await Studio.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingByPhone = await Studio.findOne({ phone });
    if (existingByPhone) {
      return res.status(400).json({ message: "Phone already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    studio = await Studio.create({
      className,
      email,
      phone,
      password: hashed,
    });

    // Generate email verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    studio.emailVerificationOtp = otp;
    studio.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await studio.save();

    const message = `Your RhythmFlow email verification OTP is: ${otp}. It is valid for 10 minutes.`;
    await sendEmail({
      to: studio.email,
      subject: "RhythmFlow Email Verification OTP",
      text: message,
    });

    return res.status(201).json({
      message:
        "Studio registered successfully. Please verify your email using the OTP sent.",
      studio: {
        id: studio._id,
        className: studio.className,
        email: studio.email,
        phone: studio.phone,
        emailVerified: studio.emailVerified,
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

    // 🟡 If email NOT verified → send OTP instead of logging in
    if (!studio.emailVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      studio.emailVerificationOtp = otp;
      studio.emailVerificationOtpExpires = new Date(
        Date.now() + 10 * 60 * 1000
      ); // 10 mins
      await studio.save();

      const message = `Your RhythmFlow email verification OTP is: ${otp}. It is valid for 10 minutes.`;

      // send email
      if (studio.email) {
        await sendEmail({
          to: studio.email,
          subject: "RhythmFlow Email Verification OTP",
          text: message,
        });
      }

      // (optional) also SMS if you want, similar to forgot-password:
      // if (studio.phone) {
      //   await sendSms(studio.phone, message);
      // }

      return res.json({
        requiresVerification: true,
        message:
          "Email not verified. OTP has been sent to your registered email.",
        studio: {
          id: studio._id,
          className: studio.className,
          email: studio.email,
          phone: studio.phone,
          emailVerified: studio.emailVerified,
        },
      });
    }

    // ✅ Normal login when email is already verified
    const token = jwt.sign({ studioId: studio._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

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
    console.error("Login Error", err);
    res.status(500).json({ message: "Sever error" });
  }
});

// POST /api/auth/forgot-password
// body: { className?, email?, phone? }  --> at least ONE required
// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { className, email, phone } = req.body;

    if (!className && !email && !phone) {
      return res
        .status(400)
        .json({ message: "Provide className or email or phone" });
    }

    let studio;
    if (className) studio = await Studio.findOne({ className });
    else if (email) studio = await Studio.findOne({ email });
    else if (phone) studio = await Studio.findOne({ phone });

    if (!studio) {
      return res
        .status(400)
        .json({ message: "No account found for given details" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    studio.resetOtp = otp;
    studio.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await studio.save();

    const message = `Your RhythmFlow password reset OTP is: ${otp}. It is valid for 10 minutes.`;


    //  Email ONLY
    await sendEmail({
      to: studio.email,
      subject: "RhythmFlow Email Verification OTP",
      text: message,
    });

    return res.json({
      message: "OTP sent to your registered email. Valid for 10 minutes.",
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

// POST /api/auth/verify-email
// body: { className?, email?, otp }
router.post("/verify-email", async (req, res) => {
  try {
    const { className, email, otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    if (!className && !email) {
      return res
        .status(400)
        .json({ message: "Provide className or email to verify" });
    }

    let studio;
    if (className) {
      studio = await Studio.findOne({ className });
    } else if (email) {
      studio = await Studio.findOne({ email });
    }

    if (
      !studio ||
      !studio.emailVerificationOtp ||
      !studio.emailVerificationOtpExpires
    ) {
      return res
        .status(400)
        .json({ message: "No verification request found for this account" });
    }

    if (studio.emailVerificationOtpExpires < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (studio.emailVerificationOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Mark email verified
    studio.emailVerified = true;
    studio.emailVerificationOtp = undefined;
    studio.emailVerificationOtpExpires = undefined;
    await studio.save();

    // Create login token now
    const token = jwt.sign({ studioId: studio._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Email verified successfully.",
      token,
      studio: {
        id: studio._id,
        className: studio.className,
        email: studio.email,
        phone: studio.phone,
        emailVerified: studio.emailVerified,
      },
    });
  } catch (e) {
    console.error("Verify email error", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
