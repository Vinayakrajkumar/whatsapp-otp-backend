const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

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
    <p>POST endpoint available at <code>/send-otp</code></p>
  `);
});

/* =========================
   3. CONFIGURATION
========================= */
const NEODOVE_API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";

// ⚠️ Recommended: keep this in Render ENV, but hardcoded also works
const NEODOVE_API_KEY =
  process.env.NEODOVE_API_KEY ||
  "PASTE_YOUR_NEODOVE_API_KEY_HERE";

const NEODOVE_CAMPAIGN_NAME = "OTP5";

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

    // Basic validation
    if (!phoneNumber || !otpCode) {
      return res.status(400).json({
        success: false,
        message: "phoneNumber and otpCode are required"
      });
    }

    console.log("📩 OTP request for:", phoneNumber);

    /* ---------- NeoDove OTP PAYLOAD ---------- */
    const neodovePayload = {
      apiKey: NEODOVE_API_KEY,
      campaignName: NEODOVE_CAMPAIGN_NAME,
      destination: String(phoneNumber),
      userName: "Student",              // ✅ REQUIRED & SAFE
      templateParams: [String(otpCode)],
      source: "website-otp-form"
    };

    // 1️⃣ Send OTP via NeoDove
    await axios.post(NEODOVE_API_URL, neodovePayload, {
      headers: { "Content-Type": "application/json" }
    });

    console.log("✅ OTP sent via NeoDove");

    /* ---------- SAVE TO GOOGLE SHEET ---------- */
    await axios.post(GOOGLE_SHEET_URL, {
      name: name || "",
      board: board || "",
      city: city || "",
      course: course || "",
      phone: phoneNumber
    });

    console.log("📊 Data saved to Google Sheet");

    return res.json({
      success: true,
      message: "OTP sent and data saved"
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
