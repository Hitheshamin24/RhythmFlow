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
      set: v => v.trim().toLowerCase(), // auto-normalize here
    },

    timing: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Unique constraint
batchSchema.index({ studio: 1, normalizedName: 1 }, { unique: true });

module.exports = mongoose.model("Batch", batchSchema);
