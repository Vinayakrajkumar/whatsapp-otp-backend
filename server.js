const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

const API_KEY = process.env.NEODOVE_API_KEY; 
const CAMPAIGN_NAME = process.env.NEODOVE_CAMPAIGN_NAME;
const SOURCE = process.env.NEODOVE_SOURCE;

const otpStore = {};
const registeredUsers = {}; 

app.get("/", (req, res) => {
  res.send("✅ OTP Backend Live");
});

app.post("/send-otp", async (req, res) => {
  let { phoneNumber } = req.body;

  if (registeredUsers[phoneNumber]) {
    return res.status(409).json({ success: false, message: "Already registered" });
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  otpStore[phoneNumber] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    const response = await axios.post(API_URL, {
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
    // 🔍 This will print the specific reason from Neodove in Render logs
    console.error("❌ NEODOVE REJECTION:", err.response?.data || err.message);
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
app.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
    // 🔒 Debugging: Check if key exists (shows first 5 chars only)
    if (API_KEY) {
        console.log(`Config Loaded. Key starts with: ${API_KEY.substring(0, 5)}...`);
    } else {
        console.log("CRITICAL: NEODOVE_API_KEY is missing in Render Environment!");
    }
});
