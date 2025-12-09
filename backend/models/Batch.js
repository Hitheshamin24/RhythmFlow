const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    studio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      set: (v) => v.trim().toLowerCase(), // auto-normalize
    },

    timing: {
      type: String,
      default: "",
      trim: true,
    },

    // ✅ NEW: Days field
    days: {
      type: [String],
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Unique constraint (studio + batch name)
batchSchema.index({ studio: 1, normalizedName: 1 }, { unique: true });

module.exports = mongoose.model("Batch", batchSchema);
