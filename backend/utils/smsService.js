// backend/utils/smsService.js
const axios = require("axios");

/**
 * Send SMS using Fast2SMS (or similar Indian provider).
 * 
 * @param {string} phone - +918495802316
 * @param {string} message - Message text (OTP, etc).
 */
async function sendSms(phone, message) {
  if (!phone) {
    console.warn("sendSms called without phone");
    return;
  }

  try {
    // If you store numbers without +91, you can normalize here:
    // const cleaned = phone.replace(/\D/g, "");
    // const finalNumber = cleaned.startsWith("91") ? cleaned : "91" + cleaned;

    const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        route: "v3",
        sender_id: process.env.FAST2SMS_SENDER_ID,
        message,
        language: "english",
        numbers: phone, // or finalNumber
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
