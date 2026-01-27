const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

/* =========================
   CONFIGURATION
========================= */
const NEODOVE_API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";
const NEODOVE_API_KEY = process.env.NEODOVE_API_KEY;
const NEODOVE_CAMPAIGN_NAME = "OTP5"; // The Campaign Name from your successful test

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

/* =========================
   SEND OTP ENDPOINT
========================= */
app.post("/send-otp", async (req, res) => {
  try {
    const { name, board, city, course, phoneNumber, otpCode } = req.body;

    // 1. Format Phone Number to exactly 12 digits (91XXXXXXXXXX)
    let formattedNumber = phoneNumber.replace(/\D/g, "");
    if (formattedNumber.length === 10) {
      formattedNumber = "91" + formattedNumber;
    }

    if (formattedNumber.length !== 12) {
      return res.status(400).json({ success: false, message: "Invalid 10-digit number" });
    }

    // 2. Prepare NeoDove Payload
    const neodovePayload = {
      apiKey: NEODOVE_API_KEY,
      campaignName: NEODOVE_CAMPAIGN_NAME,
      destination: formattedNumber,
      userName: name || "Student",
      templateParams: [
        String(otpCode) // Matches the single variable {{1}} in your message
      ],
      source: "website-form"
    };

    // 3. Send to NeoDove
    const ndResponse = await axios.post(NEODOVE_API_URL, neodovePayload);
    console.log("✅ NeoDove Status:", ndResponse.data);

    // 4. Save to Google Sheet
    await axios.post(GOOGLE_SHEET_URL, {
      name: name || "",
      board: board || "",
      city: city || "",
      course: course || "",
      phone: formattedNumber
    });

    res.json({ success: true, message: "OTP Sent & Data Saved" });

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
