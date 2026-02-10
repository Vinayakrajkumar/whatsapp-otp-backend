const express = require("express");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Temporary memory store for OTPs
const otpStore = {};

// Your confirmed working NeoDove endpoint
const NEODOVE_API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

app.get("/", (req, res) => {
  res.send("NeoDove OTP Backend is Active");
});

/**
 * ROUTE 1: Generate and Send OTP via NeoDove
 */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Phone number required" });
  }

  // Generate 4-digit code (kept on server for security)
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phoneNumber] = generatedOtp;

  try {
    const response = await axios.post(
      NEODOVE_API_URL,
      {
        apiKey: process.env.NEODOVE_API_KEY, // Use your long JWT key here
        campaignName: "OTP5",
        destination: phoneNumber,
        userName: "Website Visitor", 
        source: "website-otp-form",
        templateParams: generatedOtp // String format as per your schema
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    console.log("NeoDove Response:", response.data);
    res.json({ success: true });
  } catch (err) {
    // Log the error specifically to catch 404/401 issues
    console.error("NeoDove Error Payload:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: "Failed to connect to NeoDove" });
  }
});

/**
 * ROUTE 2: Verify the user-entered OTP
 */
app.post("/verify-otp", (req, res) => {
  const { phoneNumber, userOtp } = req.body;

  if (otpStore[phoneNumber] && otpStore[phoneNumber] === userOtp) {
    delete otpStore[phoneNumber]; // Success: Clear code after verification
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: "Invalid or expired OTP" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
