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

/* ⚠️ MUST MATCH NEO DOVE EXACTLY */
const NEODOVE_CAMPAIGN_NAME = "OTP5";

/* GOOGLE SHEET WEB APP URL */
const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

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
        message: "NeoDove API key not found in environment variables"
      });
    }

    /* ---------- FORMAT PHONE NUMBER (INDIA) ---------- */
    let formattedNumber = phoneNumber.replace(/\D/g, "");

    if (formattedNumber.length === 10) {
      formattedNumber = "91" + formattedNumber;
    }

    if (!formattedNumber.startsWith("91") || formattedNumber.length !== 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format"
      });
    }

    console.log("📩 OTP request for:", formattedNumber);

    /* ---------- SEND OTP VIA NEODOVE ---------- */
    const neodovePayload = {
      apiKey: NEODOVE_API_KEY,
      campaignName: NEODOVE_CAMPAIGN_NAME,
      destination: formattedNumber,
      userName: "Student",                // NOT a template variable
      templateParams: [
        String(otpCode)                   // {{1}} ONLY
      ],
      source: "website-otp-form"
    };

    await axios.post(NEODOVE_API_URL, neodovePayload, {
      headers: { "Content-Type": "application/json" }
    });

    console.log("✅ OTP sent via NeoDove");

    /* ---------- SAVE DATA TO GOOGLE SHEET ---------- */
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
      message: "OTP sent & data saved"
    });

  } catch (error) {
    console.error(
      "❌ ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "OTP or Google Sheet failed"
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
