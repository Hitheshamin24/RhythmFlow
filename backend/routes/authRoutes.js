const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Studio = require("../models/Studio");

const router = express.Router();

// POST /api/auth/register
// body:{classname,email,password}
router.post("/register", async (req, res) => {
  try {
    const { className, email, password } = req.body;
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
      password: hashed,
    });
    const token = jwt.sign({ studioID: studio._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({
      token,
      studio: {
        id: studio._id,
        className: studio.className,
        email: studio.email,
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

module.exports = router;
