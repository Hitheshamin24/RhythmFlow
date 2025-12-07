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
// GET /api/attendance/summary
// Returns { currentRate, lastRate } in %
router.get("/summary", async (req, res) => {
  try {
    const studioId = req.studioId;

    // 1. Get all ACTIVE students of this studio
    const activeStudents = await Student.find({
      studio: studioId,
      isActive: true,
    }).select("_id");

    const totalActive = activeStudents.length;

    if (!totalActive) {
      return res.json({ currentRate: 0, lastRate: 0 });
    }

    // 2. Get ALL attendance records for this studio
    const records = await Attendence.find({ studio: studioId }).select(
      "date presentStudents"
    );

    const now = new Date();

    // Current month (0–11)
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    // Last month: use Date math to handle January properly
    const lastMonthDate = new Date(curYear, curMonth - 1, 1);
    const lastYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    // Helper to parse "YYYY-MM-DD" strings into { year, monthIndex }
    const parseYM = (dateStr) => {
      // Protect against bad/empty strings
      if (!dateStr || typeof dateStr !== "string") return { year: 0, month: -1 };
      const [y, m] = dateStr.split("-").map(Number); // "2025-11-27" -> [2025, 11]
      return { year: y, month: m - 1 }; // JS month is 0-based
    };

    // Helper to compute attendance rate for given year & month
    const computeRateForMonth = (year, monthIndex) => {
      // Take only records in this month
      const monthRecords = records.filter((rec) => {
        const { year: y, month } = parseYM(rec.date);
        return y === year && month === monthIndex;
      });

      if (monthRecords.length === 0) return 0;

      // totalPresent = sum of number of present students per day
      let totalPresent = 0;
      monthRecords.forEach((r) => {
        totalPresent += (r.presentStudents || []).length;
      });

      // totalPossible = active students * days with attendance recorded
      const totalPossible = totalActive * monthRecords.length;
      if (!totalPossible) return 0;

      return (totalPresent / totalPossible) * 100;
    };

    const currentRate = computeRateForMonth(curYear, curMonth);
    const lastRate = computeRateForMonth(lastYear, lastMonth);

    res.json({
      currentRate,
      lastRate,
    });
  } catch (e) {
    console.error("Attendance summary error:", e);
    res
      .status(500)
      .json({ message: "Failed to compute attendance summary." });
  }
});

module.exports = router;
