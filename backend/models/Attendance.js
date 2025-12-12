const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    presentStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { timestamps: true }
);
attendanceSchema.index({ studio: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("Attendance", attendanceSchema);
