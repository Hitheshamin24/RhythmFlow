const mongoose = require("mongoose");

const studioSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,   // ✅ NOW REQUIRED
      unique: true,     // ✅ NOW UNIQUE
      trim: true,
      lowercase: true, // ✅ prevents duplicate case issues
    },

    phone: {
      type: String,
      required: true,   // ✅ NOW REQUIRED
      unique: true,     // ✅ NOW UNIQUE
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // 🔹 Forgot password flow
    resetOtp: {
      type: String,
    },
    resetOtpExpires: {
      type: Date,
    },

    // 🔹 Email verification flow
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOtp: {
      type: String,
    },
    emailVerificationOtpExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Studio", studioSchema);
