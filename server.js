const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- CONFIGURATION ---
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";
const API_KEY = process.env.NEODOVE_API_KEY; 
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

// Fixes "Cannot GET /" error
app.get("/", (req, res) => {
  res.send("<div style='text-align:center;margin-top:50px;'><h1>✅ OTP Backend Live</h1><p>API Endpoint is at <code>/send-otp</code></p></div>");
});

app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode, name, board, city, course } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  try {
    // 1. Send WhatsApp via NeoDove
    await axios.post(API_URL, {
      campaignName: "OTP5",      // From your screenshot
      templateName: "otpweb5",   // From your screenshot
      destination: phoneNumber,
     templateParams: [otpCode] // Array format required
      source: "website-otp-form"
    }, {
      headers: { 
        "Content-Type": "application/json",
        "apiKey": API_KEY
      }
    });

    // 2. Log to Google Sheets
    const sheetData = new URLSearchParams({ name, board, city, course, phone: phoneNumber, otp: otpCode });
    await axios.post(GOOGLE_SHEET_URL, sheetData.toString());

    res.json({ success: true });
  } catch (err) {
    console.error("❌ REJECTION:", err.response?.data || err.message);
    res.status(401).json({ success: false, error: "Unauthorized or API Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
