// backend/utils/smsService.js
const axios = require("axios");

async function sendSms(phone, message) {
  // 🔴 HARD STOP SMS IN PRODUCTION
  if (process.env.ENABLE_SMS !== "true") {
    console.log("[SMS DISABLED]", { phone, message });
    return;
  }

  if (!phone) {
    console.warn("sendSms called without phone");
    return;
  }

  try {
    const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        route: "v3",
        sender_id: process.env.FAST2SMS_SENDER_ID,
        message,
        language: "english",
        numbers: phone,
      },
    });

    console.log("SMS sent:", response.data);
  } catch (err) {
    console.error(
      "SMS sending error:",
      err.response?.data || err.message || err
    );
  }
}

module.exports = { sendSms };
