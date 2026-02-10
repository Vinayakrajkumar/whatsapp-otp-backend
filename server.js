const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- CONFIGURATION ---
// Official NeoDove V2 Message Send Endpoint
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

// Environment Variables from Render
const API_KEY = process.env.NEODOVE_API_KEY; 
const CAMPAIGN_NAME = process.env.NEODOVE_CAMPAIGN_NAME; // Should be "OTP5"
const SOURCE = process.env.NEODOVE_SOURCE;

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

// Root Route to fix "Cannot GET /" error
app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
      <h1 style="color: #28a745;">✅ OTP Backend is Live</h1>
      <p>Server is running correctly on Render.</p>
      <p>API Endpoint: <code>/send-otp</code></p>
    </div>
  `);
});

// Main Route to Send OTP
app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode, name, board, city, course } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false, message: "Missing phone or OTP" });
  }

  // Payload structure for NeoDove V2
  const neoDovePayload = {
    campaignName: CAMPAIGN_NAME || "OTP5",
    destination: phoneNumber,
    templateName: "otpweb5",
    templateParams: [otpCode], // Must be an array
    source: SOURCE || "website-otp-form"
  };

  try {
    // TRIGGER 1: Send WhatsApp Message via NeoDove
    const whatsappResponse = await axios.post(API_URL, neoDovePayload, {
      headers: { 
        "Content-Type": "application/json",
        // Crucial: Bearer followed by a single space and your JWT key
        "Authorization": `Bearer ${API_KEY}` 
      }
    });

    console.log("✅ NeoDove Success:", whatsappResponse.data);

    // TRIGGER 2: Log to Google Sheets
    // Note: We use URLSearchParams to match standard Google Apps Script expectations
    const sheetData = new URLSearchParams({
      name: name || "N/A",
      board: board || "N/A",
      city: city || "N/A",
      course: course || "N/A",
      phone: phoneNumber,
      otp: otpCode,
      formName: "Admission Form"
    });

    await axios.post(GOOGLE_SHEET_URL, sheetData.toString());

    res.json({ success: true });

  } catch (err) {
    // Logs specific rejection reason (e.g., 401 Unauthorized) in Render logs
    console.error("❌ REJECTION:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ 
      success: false, 
      error: err.response?.data || "Internal Server Error" 
    });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Debug check for API Key presence
  if (API_KEY) {
    console.log(`Config Loaded. Key starts with: ${API_KEY.substring(0, 10)}...`);
  } else {
    console.error("CRITICAL: NEODOVE_API_KEY is missing in Render environment!");
  }
});
