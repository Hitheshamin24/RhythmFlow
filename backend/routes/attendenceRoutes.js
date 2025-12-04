const express = require("express");
const Attendence = require("../models/Attenence");
const Student = require("../models/Student");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// POST/api/attendence
// save or update attendence for a given date
// body:{ date"2025-11-27" presenet students:["StudentID1","StudentID2".....]}

router.post("/", async (req, res) => {
  try {
    const { date, presentStudents } = req.body;
    if (!date) {
      return res.status(400).json({ message: "Date is required (YYYY-MM-DD)" });
    }
    const requestedIds = Array.isArray(presentStudents)
      ? [...new Set(presentStudents)]
      : [];

    const validStudents = await Student.find({
      _id: { $in: requestedIds },
      studio: req.studioId,
      isActive: true,
    }).select("_id");

    const validIds = validStudents.map((s) => s._id.toString());
    if (validIds.length !== requestedIds.length) {
      console.warn(
        "Some student Ids do not belong to this Studio Ignoring them "
      );
      return res
        .status(400)
        .json({ message: "Some students are not in this studio" });
    }

    const attendence = await Attendence.findOneAndUpdate(
      { studio: req.studioId, date },
      { presentStudents: validIds },
      { upsert: true, new: true }
    );
    res.json(attendence);
  } catch (e) {
    console.error("Save attendence error", e);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date query param is required" });
    }

    const allStudents = await Student.find({
      studio: req.studioId,
      isActive: true,
    });
    const attendence = await Attendence.findOne({
      studio: req.studioId,
      date,
    }).populate({
      path: "presentStudents",
      match: { studio: req.studioId },
    });

    const presentDocs = Array.isArray(attendence?.presentStudents)
      ? attendence.presentStudents
      : [];

    const presentIds = presentDocs.map((s) => s._id.toString());

    const absentees = allStudents.filter(
      (s) => !presentIds.includes(s._id.toString())
    );
    res.json({
      date,
      totalStudents: allStudents.length,
      presentCount: presentIds.length,
      absentCount: absentees.length,
      presentStudents: presentDocs,
      absentees,
    });
  } catch (e) {
    console.error("Get attandance error:", e);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
