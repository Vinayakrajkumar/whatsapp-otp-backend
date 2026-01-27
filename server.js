const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

/* =========================
   1. MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/* =========================
   2. HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send(`
    <h2 style="font-family: Arial">✅ OTP Backend is Live</h2>
    <p>POST endpoint: <code>/send-otp</code></p>
  `);
});

/* =========================
   3. CONFIGURATION
========================= */
const NEODOVE_API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";

/* 🔐 API KEY FROM RENDER ENV */
const NEODOVE_API_KEY = process.env.NEODOVE_API_KEY;

/* ⚠️ UPDATED: Matches the Template Name in your screenshot */
const NEODOVE_TEMPLATE_NAME = "otpweb5"; 

/* GOOGLE SHEET WEB APP URL */
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

/* =========================
   4. SEND OTP + SAVE DATA
========================= */
app.post("/send-otp", async (req, res) => {
  try {
    const {
      name,
      board,
      city,
      course,
      phoneNumber,
      otpCode
    } = req.body;

    /* ---------- BASIC VALIDATION ---------- */
    if (!phoneNumber || !otpCode) {
      return res.status(400).json({
        success: false,
        message: "phoneNumber and otpCode are required"
      });
    }

    if (!NEODOVE_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "NeoDove API key not found in Render environment variables"
      });
    }

    /* ---------- FORMAT PHONE NUMBER (STRICT 12-DIGIT) ---------- */
    // Remove all non-numeric characters
    let formattedNumber = phoneNumber.replace(/\D/g, "");

    // If student entered 10 digits, add the 91 country code
    if (formattedNumber.length === 10) {
      formattedNumber = "91" + formattedNumber;
    }

    // Final check for the WhatsApp-required 12-digit format
    if (formattedNumber.length !== 12 || !formattedNumber.startsWith("91")) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone format. Please enter a 10-digit number."
      });
    }

    console.log("📩 Processing OTP for:", formattedNumber);

    /* ---------- SEND OTP VIA NEODOVE ---------- */
    const neodovePayload = {
      apiKey: NEODOVE_API_KEY,
      campaignName: NEODOVE_TEMPLATE_NAME, // Using Template Name
      destination: formattedNumber,
      userName: name || "Student", 
      templateParams: [
        String(otpCode) // Matches {{1}} in your template
      ],
      source: "website-otp-form"
    };

    // Detailed Logging for Debugging
    const response = await axios.post(NEODOVE_API_URL, neodovePayload, {
      headers: { "Content-Type": "application/json" }
    });

    console.log("✅ NeoDove API Response:", response.data);

    /* ---------- SAVE DATA TO GOOGLE SHEET ---------- */
    // This happens AFTER the OTP attempt
    await axios.post(GOOGLE_SHEET_URL, {
      name: name || "",
      board: board || "",
      city: city || "",
      course: course || "",
      phone: formattedNumber
    });

    console.log("📊 Data saved to Google Sheet");

    return res.json({
      success: true,
      message: "OTP sent & data saved",
      neodoveStatus: response.data
    });

  } catch (error) {
    console.error("❌ ERROR:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Delivery failed",
      error: error.response?.data || error.message
    });
  }
});

/* =========================
   5. PORT (RENDER)
========================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
