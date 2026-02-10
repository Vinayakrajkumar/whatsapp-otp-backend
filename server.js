const express = require("express");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Memory store for OTPs (Clears if server restarts)
const otpStore = {};

const NEODOVE_API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

app.get("/", (req, res) => {
  res.send("NeoDove OTP Backend Live");
});

// 1. SEND OTP ROUTE
app.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Phone number required" });
  }

  // Generate 4-digit code on the server
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phoneNumber] = generatedOtp;

  try {
    const response = await axios.post(
      NEODOVE_API_URL,
      {
        // MATCHING YOUR SCREENSHOT EXACTLY
        apiKey: process.env.NEODOVE_API_KEY, 
        campaignName: "OTP5",
        destination: phoneNumber,
        userName: "Website Lead", // Required string field
        source: "website-otp-form", // Matches screenshot
        templateParams: [generatedOtp] // Code sent to {{1}} in template
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    console.log("NeoDove Response:", response.data);
    res.json({ success: true });
  } catch (err) {
    console.error("NEODOVE ERROR:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

// 2. VERIFY OTP ROUTE
app.post("/verify-otp", (req, res) => {
  const { phoneNumber, userOtp } = req.body;

  if (otpStore[phoneNumber] && otpStore[phoneNumber] === userOtp) {
    delete otpStore[phoneNumber]; // Secure: Use once, then delete
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: "Invalid OTP" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
