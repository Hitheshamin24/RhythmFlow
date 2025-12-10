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
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
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

    // 🔹 Email verification flow (Register & Login)
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

    // 🔹 Profile update OTP flow (Settings Page)
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    pendingPhone: {
      type: String,
      trim: true,
    },
    profileOtp: {
      type: String,
    },
    profileOtpExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Studio", studioSchema);
