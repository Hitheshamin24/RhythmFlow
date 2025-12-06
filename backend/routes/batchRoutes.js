const express = require("express");
const protect = require("../middleware/authMiddleware");
const Batch = require("../models/Batch");

const router = express.Router();
router.use(protect);

/**
 * CREATE BATCH
 * POST /api/batches
 * body: { name, timing }
 */
router.post("/", async (req, res) => {
  try {
    const { name, timing } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Batch name is required" });
    }

    const normalized = name.trim().toLowerCase();

    const exists = await Batch.findOne({
      studio: req.studioId,
      normalizedName: normalized,
    });

    if (exists) {
      return res.status(400).json({ message: "Batch name already exists for this studio" });
    }

    const batch = await Batch.create({
      studio: req.studioId,
      name,
      normalizedName: normalized, // setter will format automatically
      timing: timing || "",
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

/**
 * UPDATE BATCH
 * PUT /api/batches/:id
 * body: { name, timing }
 */router.put("/:id", async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      studio: req.studioId,
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const { name, timing } = req.body;

    // If user is updating name -> check duplicate
    if (name && name.trim()) {
      const normalized = name.trim().toLowerCase();

      const exists = await Batch.findOne({
        studio: req.studioId,
        normalizedName: normalized,
        _id: { $ne: batch._id }, // ignore same batch
      });

      if (exists) {
        return res
          .status(400)
          .json({ message: "Another batch already has this name" });
      }

      batch.name = name.trim();
      batch.normalizedName = normalized; // auto update
    }

    // Update timing if provided
    if (timing !== undefined) {
      batch.timing = timing;
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
