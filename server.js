const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express(); // Define app BEFORE using it
app.use(express.json());
app.use(cors());

const otpStore = {};
const registeredUsers = {}; // Memory storage for verified users 

const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";
const API_KEY = process.env.API_KEY;

// 1. Health Check
app.get("/", (req, res) => {
  res.send("✅ OTP Backend is Live");
});

// 2. Send OTP with Duplicate Check
app.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) return res.status(400).json({ success: false });

  // CHECK IF ALREADY REGISTERED
  if (registeredUsers[phoneNumber]) {
    return res.status(409).json({ 
      success: false, 
      message: "The number you entered is already registered. We will contact you soon." 
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
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 3. Verify OTP and Register Number
app.post("/verify-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (otpStore[phoneNumber] === otp) {
    delete otpStore[phoneNumber];
    registeredUsers[phoneNumber] = true; // Mark as registered
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
