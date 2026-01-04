const express = require("express");
const Student = require("../models/Student");
const protect = require("../middleware/authMiddleware");
const Attendance = require("../models/Attendance");

const router = express.Router();

router.use(protect);

// POST/api/attendance
// save or update attendance for a given date
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

    const attendance = await Attendance.findOneAndUpdate(
      { studio: req.studioId, date },
      { presentStudents: validIds },
      { upsert: true, new: true }
    );
    res.json(attendance);
  } catch (e) {
    console.error("Save attendence error", e);
    res.status(500).json({ message: "Server error" });
  }
});
// GET /api/attendance/weekly
// Returns present count for each day of current week (Mon–Sun)
router.get("/weekly", async (req, res) => {
  try {
    const studioId = req.studioId;

    // --- Calculate start & end of week (Monday → Sunday)
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);

    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // --- Fetch attendance records for this week
    const records = await Attendance.find({
      studio: studioId,
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    }).select("date presentStudents");

    // --- Prepare response structure
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyData = days.map((d) => ({ day: d, present: 0 }));

    // --- Fill counts
    records.forEach((record) => {
      const dateObj = new Date(record.date);
      const jsDay = dateObj.getDay(); // 0=Sun
      const index = jsDay === 0 ? 6 : jsDay - 1;

      weeklyData[index].present = (record.presentStudents || []).length;
    });

    res.json(weeklyData);
  } catch (e) {
    console.error("Weekly attendance error:", e);
    res.status(500).json({ message: "Failed to load weekly attendance" });
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
    const records = await Attendance.find({ studio: studioId }).select(
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

// GET /api/attendence?date=YYYY-MM-DD&batch=<batchId?>
// returns { date, presentStudents: [id, id, ...] } or 404 if not found
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Missing date (YYYY-MM-DD) in query" });
    }

    const attendance = await Attendance.findOne({ studio: req.studioId, date }).lean();
    if (!attendance) {
      return res.status(404).json({ message: "No attendance record for this date" });
    }

    // attendance.presentStudents should be an array of ids (ObjectId or string)
    // return as-is so frontend can handle as array of IDs
    return res.json({
      date: attendance.date,
      presentStudents: attendance.presentStudents || [],
    });
  } catch (e) {
    console.error("Failed to fetch attendance", e);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
