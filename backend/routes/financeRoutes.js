// backend/routes/financeRoutes.js
const express = require("express");
const mongoose = require("mongoose"); // <-- required for aggregate ObjectId
const protect = require("../middleware/authMiddleware");
const Student = require("../models/Student");
const Expense = require("../models/Expense");

const router = express.Router();
router.use(protect);

// GET Finance Summary
router.get("/summary", async (req, res) => {
  try {
    const studioId = req.studioId;

    // students
    const students = await Student.find({ studio: studioId, isActive: true });

    const totalExpected = students.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
    const totalCollected = students
      .filter((s) => s.isPaid)
      .reduce((sum, s) => sum + (s.monthlyFee || 0), 0);

    const pending = totalExpected - totalCollected;

    // expenses
    const expenses = await Expense.find({ studio: studioId });

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const profit = totalCollected - totalExpenses;

    res.json({
      totalExpected,
      totalCollected,
      pending,
      totalExpenses,
      profit,
      expenses,
    });
  } catch (err) {
    console.error("Finance summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD expense
router.post("/expense", async (req, res) => {
  try {
    const { title, amount, category } = req.body;

    const item = await Expense.create({
      studio: req.studioId,
      title,
      amount,
      category,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error("Expense add error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE expense
router.delete("/expense/:id", async (req, res) => {
  try {
    const item = await Expense.findOne({
      _id: req.params.id,
      studio: req.studioId,
    });

    if (!item) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await item.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Expense delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/finance/monthly?months=6
router.get("/monthly", async (req, res) => {
  try {
    const studioId = req.studioId;
    let months = parseInt(req.query.months || "6", 10);
    if (Number.isNaN(months) || months <= 0) months = 6;
    // cap months to avoid heavy queries
    months = Math.min(months, 24);

    // build a list of month starts (UTC) from oldest to newest
    const now = new Date();
    const monthStarts = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      monthStarts.push(d);
    }

    // compute month ranges (start inclusive, end exclusive)
    const ranges = monthStarts.map((d) => {
      const start = d;
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      return { start, end };
    });

    // Aggregate expenses by month using createdAt
const expensesAgg = await Expense.aggregate([
  { $match: { studio: new mongoose.Types.ObjectId(studioId) } },
  {
    $addFields: {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
    },
  },
  {
    $group: {
      _id: { year: "$year", month: "$month" },
      total: { $sum: "$amount" },
    },
  },
]);


    // Build a map for expense totals keyed by "YYYY-M"
    const expenseMap = {};
    expensesAgg.forEach((e) => {
      const key = `${e._id.year}-${e._id.month}`;
      expenseMap[key] = e.total;
    });

    // For income: sum monthlyFee for students whose lastPaidDate falls in that month
    const students = await Student.find({ studio: studioId, isActive: true }).select("monthlyFee lastPaidDate");

    const incomeMap = {};
    students.forEach((s) => {
      if (!s.lastPaidDate) return;
      const dt = new Date(s.lastPaidDate);
      const key = `${dt.getUTCFullYear()}-${dt.getUTCMonth() + 1}`; // month is 1-based
      incomeMap[key] = (incomeMap[key] || 0) + (s.monthlyFee || 0);
    });

    // Build response array matching ranges order
    const data = ranges.map((r) => {
      const yr = r.start.getUTCFullYear();
      const m = r.start.getUTCMonth() + 1;
      const key = `${yr}-${m}`;
      const income = incomeMap[key] || 0;
      const expenses = expenseMap[key] || 0;
      return {
        label: r.start.toLocaleString("default", { month: "short", year: "numeric" }), // e.g. "Jul 2025"
        year: yr,
        month: m,
        income,
        expenses,
        profit: income - expenses,
      };
    });

    res.json({ months: data });
  } catch (err) {
    console.error("Monthly finance error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
