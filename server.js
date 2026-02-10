const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// --- Configuration ---
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
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Phone number required" });
  }

  if (registeredUsers[phoneNumber]) {
    return res.status(409).json({ success: false, message: "Already registered" });
  }

  // Generate 4-digit OTP
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  otpStore[phoneNumber] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  console.log(`Sending OTP to ${phoneNumber}...`);

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
    
    console.log("✅ NeoDove Success:", response.data);
    res.json({ success: true });
  } catch (err) {
    // 401 error will be caught here and logged clearly
    const errorData = err.response?.data || err.message;
    console.error("❌ NEODOVE REJECTION:", errorData);
    res.status(err.response?.status || 500).json({ success: false, error: errorData });
  }
});

app.post("/verify-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;
  const stored = otpStore[phoneNumber];

  if (stored && stored.otp === String(otp) && Date.now() < stored.expires) {
    registeredUsers[phoneNumber] = true;
    delete otpStore[phoneNumber];
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Invalid or expired OTP" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (!API_KEY) {
        console.error("CRITICAL: NEODOVE_API_KEY is missing from environment variables!");
    } else {
        console.log(`Config Loaded. Key starts with: ${API_KEY.substring(0, 5)}...`);
    }
});
