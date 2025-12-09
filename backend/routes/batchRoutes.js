const express = require("express");
const protect = require("../middleware/authMiddleware");
const Batch = require("../models/Batch");

const router = express.Router();
router.use(protect);

const ALLOWED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// CREATE BATCH
// POST /api/batches
// body: { name, timing, days: ["Mon","Wed","Fri"] }
router.post("/", async (req, res) => {
  try {
    const { name, timing, days } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Batch name is required" });
    }

    // ✅ validate days
    if (!Array.isArray(days) || days.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one day is required" });
    }

    const invalid = days.filter((d) => !ALLOWED_DAYS.includes(d));
    if (invalid.length > 0) {
      return res.status(400).json({
        message: `Invalid days: ${invalid.join(
          ", "
        )}. Allowed: ${ALLOWED_DAYS.join(", ")}`,
      });
    }

    const normalizedName = name.trim().toLowerCase();

    // check duplicate name within same studio
    const exists = await Batch.findOne({ studio: req.studioId, normalizedName });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Batch name already exists for this studio" });
    }

    const batch = await Batch.create({
      studio: req.studioId,
      name: name.trim(),
      normalizedName,
      timing: timing || "",
      days, // ✅ save days
    });

    res.status(201).json(batch);
  } catch (err) {
    console.error("Create batch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * GET ALL BATCHES OF A STUDIO
 * GET /api/batches
 */
router.get("/", async (req, res) => {
  try {
    const batches = await Batch.find({ studio: req.studioId }).sort({
      createdAt: -1,
    });

    res.json(batches);
  } catch (err) {
    console.error("Get batches error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// UPDATE BATCH
// PUT /api/batches/:id
// body: { name?, timing?, days? }
router.put("/:id", async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      studio: req.studioId,
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const { name, timing, days } = req.body;

    // if name is changed, also update normalizedName and check duplicate
    if (name && name.trim() && name.trim() !== batch.name) {
      const normalizedName = name.trim().toLowerCase();

      const exists = await Batch.findOne({
        studio: req.studioId,
        normalizedName,
        _id: { $ne: batch._id },
      });
      if (exists) {
        return res
          .status(400)
          .json({ message: "Another batch already uses this name" });
      }

      batch.name = name.trim();
      batch.normalizedName = normalizedName;
    }

    if (typeof timing !== "undefined") {
      batch.timing = timing;
    }

    // ✅ update days if sent
    if (typeof days !== "undefined") {
      if (!Array.isArray(days) || days.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one day is required" });
      }
      const invalid = days.filter((d) => !ALLOWED_DAYS.includes(d));
      if (invalid.length > 0) {
        return res.status(400).json({
          message: `Invalid days: ${invalid.join(
            ", "
          )}. Allowed: ${ALLOWED_DAYS.join(", ")}`,
        });
      }
      batch.days = days;
    }

    await batch.save();
    res.json(batch);
  } catch (err) {
    console.error("Update batch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * DELETE BATCH
 * DELETE /api/batches/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      studio: req.studioId,
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    await batch.deleteOne();

    res.json({ message: "Batch deleted" });
  } catch (err) {
    console.error("Delete batch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
