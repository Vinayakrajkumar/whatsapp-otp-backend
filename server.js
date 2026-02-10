const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

/* ================== CONFIG ================== */

// 🔥 FIXED: This is the correct Neodove V2 send endpoint
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

// Ensure these match your Render Environment Variable names exactly
const API_KEY = process.env.NEODOVE_API_KEY; 
const CAMPAIGN_NAME = process.env.NEODOVE_CAMPAIGN_NAME;
const SOURCE = process.env.NEODOVE_SOURCE;

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

/* ================== STORAGE ================== */
const otpStore = {};
const registeredUsers = {}; 

/* ================== ROUTES ================== */

app.get("/", (req, res) => {
  res.send("✅ OTP Backend Running");
});

app.post("/send-otp", async (req, res) => {
  let { phoneNumber, name, board, city, course } = req.body;

  if (!phoneNumber || !name) {
    return res.status(400).json({ success: false, message: "Missing info" });
  }

  if (registeredUsers[phoneNumber]) {
    return res.status(409).json({ 
      success: false, 
      message: "The number you entered is already registered. We will contact you soon." 
    });
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  otpStore[phoneNumber] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000,
    user: { name, board, city, course }
  };

  try {
    // 🔥 FIXED: API Key MUST be in Headers formatted as 'Bearer YOUR_KEY'
    await axios.post(API_URL, {
      campaignName: CAMPAIGN_NAME,
      destination: phoneNumber,
      templateName: "otpweb5",
      templateParams: [otp],
      source: SOURCE
    }, {
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}` 
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ OTP SEND ERROR:", err.response?.data || err.message);
    res.status(500).json({ success: false });
  }
});

app.post("/verify-otp", async (req, res) => {
  let { phoneNumber, otp } = req.body;
  const record = otpStore[phoneNumber];

  if (!record || record.otp !== String(otp)) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  try {
    // Save to Google Sheets
    await axios.post(GOOGLE_SHEET_URL, {
      name: record.user.name,
      board: record.user.board,
      city: record.user.city,
      course: record.user.course,
      phone: phoneNumber
    });

    registeredUsers[phoneNumber] = true; 
    delete otpStore[phoneNumber];
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
