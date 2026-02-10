const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
// FIXED: This is the correct send endpoint for Neodove V2
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

// Ensure these match your Render Environment Variable names EXACTLY
const API_KEY = process.env.NEODOVE_API_KEY; 
const CAMPAIGN_NAME = process.env.NEODOVE_CAMPAIGN_NAME;
const SOURCE = process.env.NEODOVE_SOURCE;

const otpStore = {};
const registeredUsers = {}; 

app.get("/", (req, res) => {
  res.send("✅ OTP Backend Running");
});

app.post("/send-otp", async (req, res) => {
  let { phoneNumber, name, board, city, course } = req.body;

  // Duplicate Check
  if (registeredUsers[phoneNumber]) {
    return res.status(409).json({ success: false, message: "Already registered" });
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  otpStore[phoneNumber] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    // 🔥 THE FIX: API Key MUST be in the Headers, not the body
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

app.post("/verify-otp", (req, res) => {
  let { phoneNumber, otp } = req.body;
  if (otpStore[phoneNumber] && otpStore[phoneNumber].otp === String(otp)) {
    registeredUsers[phoneNumber] = true;
    delete otpStore[phoneNumber];
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
