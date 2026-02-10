const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ───────────── MIDDLEWARE ───────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/* ───────────── CONFIG ───────────── */
const API_URL =
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw";

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

/* ───────────── OTP STORE (in-memory) ───────────── */
const otpStore = new Map();

/* ───────────── ROOT CHECK ───────────── */
app.get("/", (req, res) => {
  res.send(`
    <div style="text-align:center;margin-top:40px;font-family:Arial">
      <h1>✅ OTP Backend Live</h1>
      <p>Endpoints:</p>
      <p><code>POST /send-otp</code></p>
      <p><code>POST /verify-otp</code></p>
    </div>
  `);
});

/* ───────────── SEND OTP ───────────── */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber, name, board, city, course } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Phone missing" });
  }

  // 🔐 Generate 4-digit OTP
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    /* 1️⃣ Send WhatsApp OTP */
  await axios.post(
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send",
  {
    campaignName: "OTP5",
    templateName: "otpweb5",
    destination: phoneNumber,
    templateParams: [otpCode],
    source: "website-otp-form"
  },
  {
    headers: {
      "Content-Type": "application/json",
      apiKey: API_KEY
    }
  }
);

    /* 2️⃣ Store OTP (2 min expiry) */
    otpStore.set(phoneNumber, {
      otp: otpCode,
      expiresAt: Date.now() + 2 * 60 * 1000
    });

    /* 3️⃣ Save lead to Google Sheet */
    const sheetPayload = new URLSearchParams({
      name: name || "",
      board: board || "",
      city: city || "",
      course: course || "",
      phone: phoneNumber
    });

    await axios.post(GOOGLE_SHEET_URL, sheetPayload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ SEND OTP ERROR:", err.response?.data || err.message);
    res.status(500).json({ success: false });
  }
});

/* ───────────── VERIFY OTP ───────────── */
app.post("/verify-otp", (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.json({ success: false });
  }

  const record = otpStore.get(phoneNumber);

  if (!record) {
    return res.json({ success: false });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phoneNumber);
    return res.json({ success: false });
  }

  if (record.otp !== otpCode) {
    return res.json({ success: false });
  }

  // ✅ OTP verified
  otpStore.delete(phoneNumber);
  res.json({ success: true });
});

/* ───────────── START SERVER ───────────── */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
