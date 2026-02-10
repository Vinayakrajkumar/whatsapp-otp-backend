const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ────────── MIDDLEWARE ──────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ────────── CONFIG ──────────
const API_URL =
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

const API_KEY = process.env.NEODOVE_API_KEY;

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

// ────────── ROOT CHECK ──────────
app.get("/", (req, res) => {
  res.send(`
    <div style="text-align:center;margin-top:40px;font-family:Arial">
      <h1>✅ OTP Backend Live</h1>
      <p>Use <code>/send-otp</code> to send WhatsApp OTP</p>
    </div>
  `);
});

// ────────── SEND OTP ──────────
app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode, name, board, city, course } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({
      success: false,
      message: "Phone number or OTP missing"
    });
  }

  try {
    // 1️⃣ Send WhatsApp OTP via NeoDove
    await axios.post(
      API_URL,
      {
        campaignName: "OTP5",
        templateName: "otpweb5",
        destination: phoneNumber,
        templateParams: [otpCode], // MUST be array
        source: "website-otp-form"
      },
      {
        headers: {
          "Content-Type": "application/json",
          apiKey: API_KEY
        }
      }
    );

    // 2️⃣ Save lead + OTP to Google Sheets
    const sheetPayload = new URLSearchParams({
      name: name || "",
      board: board || "",
      city: city || "",
      course: course || "",
      phone: phoneNumber,
      otp: otpCode
    });

    await axios.post(GOOGLE_SHEET_URL, sheetPayload.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(
      "❌ NeoDove Error:",
      err.response?.data || err.message
    );

    res.status(401).json({
      success: false,
      error: "OTP send failed"
    });
  }
});

// ────────── START SERVER ──────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
