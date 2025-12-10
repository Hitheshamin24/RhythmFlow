const express = require("express");
const bcrypt = require("bcryptjs");
const Studio = require("../models/Studio");
const protect = require("../middleware/authMiddleware");
const transporter = require("../utils/mailer");

const router = express.Router();

// all routes here require auth
router.use(protect);

/**
 * GET /api/studio/me
 * Get current studio profile
 */
router.get("/me", async (req, res) => {
  try {
    const studio = await Studio.findById(req.studioId).select(
      "className email phone createdAt"
    );

    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    res.json(studio);
  } catch (err) {
    console.error("Get studio profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/**
 * PUT /api/studio/me
 * Update email, phone, className with OTP for email/phone change
 * body: { email?, phone?, className? }
 */
router.put("/me", async (req, res) => {
  try {
    const { email, phone, className } = req.body;

    const studio = await Studio.findById(req.studioId);
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const trimmedClassName =
      typeof className === "string" ? className.trim() : undefined;

    const emailChanged =
      typeof email === "string" && email && email !== studio.email;
    const phoneChanged =
      typeof phone === "string" && phone && phone !== studio.phone;
    const classNameChanged =
      typeof trimmedClassName === "string" &&
      trimmedClassName &&
      trimmedClassName !== studio.className;

    // 🔍 Uniqueness checks
    if (emailChanged) {
      const existingEmail = await Studio.findOne({
        email,
        _id: { $ne: studio._id },
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use." });
      }
    }

    if (phoneChanged) {
      const existingPhone = await Studio.findOne({
        phone,
        _id: { $ne: studio._id },
      });
      if (existingPhone) {
        return res.status(400).json({ message: "Phone already in use." });
      }
    }

    if (classNameChanged) {
      const existingClass = await Studio.findOne({
        className: trimmedClassName,
        _id: { $ne: studio._id },
      });
      if (existingClass) {
        return res
          .status(400)
          .json({ message: "A studio with this name already exists." });
      }
      studio.className = trimmedClassName;
    }

    // 🟡 If email/phone changed → OTP flow
    if (emailChanged || phoneChanged) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      studio.pendingEmail = emailChanged ? email : studio.pendingEmail;
      studio.pendingPhone = phoneChanged ? phone : studio.pendingPhone;
      studio.profileOtp = otp;
      studio.profileOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await studio.save();

      const message = `Your RhythmFlow profile update OTP is: ${otp}. It is valid for 10 minutes.`;

      if (emailChanged) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "RhythmFlow Profile Update OTP",
          text: message,
        });
      }

      if (phoneChanged) {
        await sendSms(phone, message);
      }

      return res.json({
        requiresVerification: true,
        message:
          "OTP sent to your new email/phone. Enter it to confirm the changes.",
        className: studio.className,
      });
    }

    // ✅ No sensitive changes → just save & return updated profile
    await studio.save();

    res.json({
      id: studio._id,
      className: studio.className,
      email: studio.email,
      phone: studio.phone,
    });
  } catch (err) {
    console.error("Update studio profile error:", err);

    res.status(500).json({ message: "Server error" });
  }
});
/**
 * POST /api/studio/verify-profile-otp
 * body: { otp }
 * Confirms pendingEmail / pendingPhone using OTP
 */
router.post("/verify-profile-otp", async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const studio = await Studio.findById(req.studioId);
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    if (!studio.profileOtp || !studio.profileOtpExpires) {
      return res
        .status(400)
        .json({ message: "No profile update OTP request found." });
    }

    if (studio.profileOtpExpires < new Date()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    if (studio.profileOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // ✅ Apply pending values
    if (studio.pendingEmail) {
      studio.email = studio.pendingEmail;
    }
    if (studio.pendingPhone) {
      studio.phone = studio.pendingPhone;
    }

    studio.pendingEmail = undefined;
    studio.pendingPhone = undefined;
    studio.profileOtp = undefined;
    studio.profileOtpExpires = undefined;

    await studio.save();

    return res.json({
      id: studio._id,
      className: studio.className,
      email: studio.email,
      phone: studio.phone,
    });
  } catch (err) {
    console.error("Verify profile OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * POST /api/studio/change-password
 * body: { currentPassword, newPassword }
 */
router.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    const studio = await Studio.findById(req.studioId);
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, studio.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    studio.password = hashed;
    await studio.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
