const mongoose = require("mongoose");

const studioSettingsSchema = new mongoose.Schema(
  {
    studio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      unique: true,
      required: true,
    },

    ownerName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    defaultMonthlyFee: {
      type: Number,
      default: 0,
    },

    monthStartDay: {
      type: Number,
      default: 1, // 1st day of month
    },

    hideInactiveByDefault: {
      type: Boolean,
      default: true,
    },

    feeReminderTemplate: {
      type: String,
      default:
        "Hi {parentName}, this is a reminder that {month} fees ({amount}) for {studentName} at {studioName} are pending.",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudioSettings", studioSettingsSchema);
