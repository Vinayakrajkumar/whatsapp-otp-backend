const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

// Ensure these match your Render Environment Variable names exactly
const API_KEY = process.env.NEODOVE_API_KEY; 
const CAMPAIGN_NAME = process.env.NEODOVE_CAMPAIGN_NAME;
const SOURCE = process.env.NEODOVE_SOURCE;

const otpStore = {};
const registeredUsers = {}; 

app.get("/", (req, res) => {
  res.send("✅ OTP Backend is Live");
});

app.post("/send-otp", async (req, res) => {
  let { phoneNumber } = req.body;

  if (registeredUsers[phoneNumber]) {
    return res.status(409).json({ success: false, message: "Already registered" });
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  otpStore[phoneNumber] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    // 🔥 THE CRITICAL FIX: Headers must contain the Bearer token
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
    
    console.log("Neodove Success:", response.data);
    res.json({ success: true });
  } catch (err) {
    // This logs the specific reason Neodove is rejecting the key
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
    console.log(`🚀 Server on port ${PORT}`);
    console.log("Checking Config: ", { 
        hasKey: !!API_KEY, 
        hasCampaign: !!CAMPAIGN_NAME 
    });
});
