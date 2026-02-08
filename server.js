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
   2. IN-MEMORY OTP STORE
   (replace with DB later)
========================= */
const otpStore = {}; 
/*
  Structure:
  otpStore[phoneNumber] = {
    otpSentAt: timestamp,
    status: "PENDING" | "SUBMITTED"
  }
*/

const OTP_COOLDOWN = 60 * 1000; // 1 minute

/* =========================
   3. HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ OTP Backend is Live");
});

/* =========================
   4. NEODOVE CONFIG
========================= */
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";
const API_KEY = process.env.API_KEY;

/* =========================
   5. GOOGLE SHEET URL
========================= */
const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

/* =========================
   6. SEND OTP ROUTE
========================= */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode, name, board, city, course } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({
      success: false,
      message: "Phone number and OTP are required"
    });
  }

  const now = Date.now();
  const record = otpStore[phoneNumber];

  /* ---------- CASE 1: ALREADY REGISTERED ---------- */
  if (record && record.status === "SUBMITTED") {
    return res.json({
      success: false,
      status: "REGISTERED",
      message:
        "The number you entered is already registered. We will contact you soon."
    });
  }

  /* ---------- CASE 2: WAIT FOR 1 MINUTE ---------- */
  if (record && now - record.otpSentAt < OTP_COOLDOWN) {
    return res.json({
      success: false,
      status: "WAIT",
      message: "Please wait for 1 minute before requesting OTP again."
    });
  }

  /* ---------- SEND OTP ---------- */
  const payload = {
    apiKey: API_KEY,
    campaignName: "OTP5",
    destination: String(phoneNumber),
    userName: "Student",
    templateParams: [String(otpCode)],
    source: "website-otp-form"
  };

  try {
    await axios.post(API_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    /* ---------- SAVE / UPDATE OTP RECORD ---------- */
    otpStore[phoneNumber] = {
      otpSentAt: now,
      status: "PENDING"
    };

    /* ---------- SAVE TO GOOGLE SHEET (ONLY ONCE) ---------- */
    if (!record) {
      await axios.post(GOOGLE_SHEET_URL, {
        name: name || "",
        board: board || "",
        city: city || "",
        course: course || "",
        phone: phoneNumber
      });
    }

    res.json({
      success: true,
      status: "OTP_SENT",
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "OTP sending failed"
    });
  }
});

/* =========================
   7. VERIFY OTP ROUTE
========================= */
app.post("/verify-otp", (req, res) => {
  const { phoneNumber } = req.body;

  if (!otpStore[phoneNumber]) {
    return res.json({
      success: false,
      message: "Invalid session"
    });
  }

  otpStore[phoneNumber].status = "SUBMITTED";

  res.json({
    success: true,
    message: "OTP verified successfully"
  });
});

/* =========================
   8. PORT
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
