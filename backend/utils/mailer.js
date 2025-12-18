const nodemailer = require("nodemailer");

console.log("📧 Initializing mailer...");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// 🔥 VERIFY SMTP AT STARTUP
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP VERIFY FAILED:", error);
  } else {
    console.log("✅ SMTP SERVER READY");
  }
});

module.exports = transporter;
