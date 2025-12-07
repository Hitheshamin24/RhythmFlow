const express = require("express");
const bcrypt = require("bcryptjs");
const Studio = require("../models/Studio");
const protect = require("../middleware/authMiddleware");

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
 * Update email, phone (and optionally className if you want)
 * body: { email?, phone?, className? }
 */
router.put("/me", async (req, res) => {
  try {
    const { email, phone, className } = req.body;

    const studio = await Studio.findById(req.studioId);
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    if (typeof email === "string") studio.email = email;
    if (typeof phone === "string") studio.phone = phone;

    // ⚠️ Optional: allow renaming studio
    if (typeof className === "string" && className.trim()) {
      studio.className = className.trim();
    }

    await studio.save();

    res.json({
      id: studio._id,
      className: studio.className,
      email: studio.email,
      phone: studio.phone,
    });
  } catch (err) {
    console.error("Update studio profile error:", err);

    // handle duplicate className error nicely
    if (err.code === 11000 && err.keyPattern?.className) {
      return res
        .status(400)
        .json({ message: "A studio with this name already exists." });
    }

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
