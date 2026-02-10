const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";
const API_KEY = process.env.NEODOVE_API_KEY; 

app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false, message: "Missing phone or OTP" });
  }

  const payload = {
    campaignName: "OTP5",      // From your screenshot
    templateName: "otpweb5",   // From your screenshot
    destination: phoneNumber,
    templateParams: [otpCode], // Must be an array
    source: "website-otp-form"
  };

  try {
    const response = await axios.post(API_URL, payload, {
      headers: { 
        "Content-Type": "application/json",
        // Format: Bearer <space> your_long_key
        "Authorization": `Bearer ${API_KEY}` 
      }
    });
    
    console.log("✅ NeoDove Success:", response.data);
    res.json({ success: true });
  } catch (err) {
    // This logs the exact reason for rejection in your Render logs
    console.error("❌ NEODOVE REJECTION:", err.response?.data || err.message);
    res.status(401).json({ success: false, error: "Unauthorized - Check API Key" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
