const express = require("express");
const Student = require("../models/Student");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// all payment routes are protected
router.use(protect);

// PUT /api/payments/reset  -> mark all students as unpaid for this studio
router.put("/reset", async (req, res) => {
  try {
    const result = await Student.updateMany(
      { studio: req.studioId, isActive: true },
      { $set: { isPaid: false } }
    );

    res.json({
      message: "All active students marked as unpaid.",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Payment reset error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/payments/pay/:id  -> mark student as paid
router.put("/pay/:id", async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      studio: req.studioId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.isPaid = true;
    student.lastPaidDate=new Date();
    await student.save();

    res.json({ message: "Marked as paid", student });
  } catch (err) {
    console.error("Payment pay error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/payments/unpay/:id  -> mark student as unpaid
router.put("/unpay/:id", async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      studio: req.studioId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.isPaid = false;
    student.lastPaidDate=null
    await student.save();

    res.json({ message: "Marked as unpaid", student });
  } catch (err) {
    console.error("Payment unpay error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/payments  -> summary + paid list + unpaid list
router.get("/", async (req, res) => {
  try {
    const students = await Student.find({
      studio: req.studioId,
      isActive: true,
    });

    const paid = students.filter((s) => s.isPaid);
    const unpaid = students.filter((s) => !s.isPaid);

    res.json({
      total: students.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      paid,
      unpaid,
    });
  } catch (err) {
    console.error("Payment list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
