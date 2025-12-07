const express = require("express");
const Student = require("../models/Student");
const Batch = require("../models/Batch");
const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

// POST /api/students
// body: { name, parentName, phone, email, monthlyFee, batch }
router.post("/", async (req, res) => {
  try {
    const { name, parentName, phone, email, monthlyFee, batch } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Student name is required" });
    }

    // 1️⃣ Build base data
    const studentData = {
      studio: req.studioId,
      name,
      parentName,
      phone,
      email,
      monthlyFee: monthlyFee || 0,
    };

    // 2️⃣ If batch is provided, validate and attach
    if (batch) {
      const batchDoc = await Batch.findOne({
        _id: batch,
        studio: req.studioId,
      });

      if (!batchDoc) {
        return res
          .status(400)
          .json({ message: "Invalid batch for this studio" });
      }

      studentData.batch = batch;
    }

    // 3️⃣ Create once with batch included
    const student = await Student.create(studentData);

    res.status(201).json(student);
  } catch (e) {
    console.error("Create student error", e);
    res.status(500).json({ message: "Server error" });
  }
});



// get /api students
// get all students for this studio

router.get("/", async (req, res) => {
  try {
    const students = await Student.find({ studio: req.studioId }).sort({
      createdAt: -1,
    });
    res.json(students);
  } catch (e) {
    console.error("Get Students error : ", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET api/studets:id
// get single student only if belongs to this studio

router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      studio: req.studioId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (e) {
    console.error("Get student error: ", e);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/students/:id
// update student

router.put("/:id", async (req, res) => {
  try {
    console.log("PUT /students/:id called");
    console.log("params.id:", req.params.id);
    console.log("req.body:", req.body);
    console.log("req.studioId:", req.studioId);

    const updated = await Student.findOneAndUpdate(
      { _id: req.params.id, studio: req.studioId },
      req.body,
      { new: true, runValidators: true }
    );

    console.log("findOneAndUpdate result:", updated);

    if (!updated) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(updated);
  } catch (e) {
    console.error("Updated Student error", e);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/students/:id
// delete student

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Student.findOneAndDelete({
      _id: req.params.id,
      studio: req.studioId,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted" });
  } catch (e) {
    console.error("Delete studetn error:", e);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
