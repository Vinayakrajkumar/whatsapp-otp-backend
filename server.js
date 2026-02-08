const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

// 1. MUST CREATE APP FIRST
const app = express();

// 2. APPLY MIDDLEWARE
app.use(express.json());
app.use(cors());

// 3. STORAGE OBJECTS
const otpStore = {};
const registeredUsers = {}; // In-memory storage for duplicate check

const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";
const API_KEY = process.env.API_KEY;

// 4. ROUTES
app.get("/", (req, res) => {
  res.send("✅ OTP Backend is Live");
});

app.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ success: false });

  // CHECK FOR REPEATED NUMBER
  if (registeredUsers[phoneNumber]) {
    return res.status(409).json({ 
      success: false, 
      message: "Already registered" 
    });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phoneNumber] = otp;

  try {
    await axios.post(API_URL, {
      campaignName: "OTP5",
      templateName: "otpweb5",
      destination: phoneNumber,
      templateParams: [otp],
      source: "website-otp-form"
    }, {
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}` 
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Neodove Error:", err.response?.data || err.message);
    res.status(500).json({ success: false });
  }
});

app.post("/verify-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (otpStore[phoneNumber] === otp) {
    delete otpStore[phoneNumber];
    registeredUsers[phoneNumber] = true; // Save as registered
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 5. START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
