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
   2. IN-MEMORY STORE
========================= */
const otpStore = {};
/*
otpStore[phoneNumber] = {
  otp: "1234",
  status: "OTP_SENT" | "REGISTERED"
}
*/

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
   6. SEND OTP (ONLY ONCE)
========================= */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber, name, board, city, course } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required"
    });
  }

  /* ---------- BLOCK IF ALREADY REGISTERED ---------- */
  if (otpStore[phoneNumber]?.status === "REGISTERED") {
    return res.json({
      success: false,
      status: "REGISTERED",
      message:
        "The number you entered is already registered. We will contact you soon."
    });
  }

  /* ---------- BLOCK MULTIPLE OTP ---------- */
  if (otpStore[phoneNumber]?.status === "OTP_SENT") {
    return res.json({
      success: false,
      status: "REGISTERED",
      message:
        "The number you entered is already registered. We will contact you soon."
    });
  }

  /* ---------- GENERATE OTP ---------- */
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

  const payload = {
    campaignName: "OTP5",            // ✅ must match Neodove dashboard
    destination: String(phoneNumber),// ✅ format: 91XXXXXXXXXX
    userName: "Student",
    templateParams: [otpCode],
    source: "website-otp-form"
  };

  try {
    /* ---------- SEND OTP (FIXED AUTH HEADER) ---------- */
    await axios.post(API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      }
    });

    /* ---------- SAVE OTP STATE ---------- */
    otpStore[phoneNumber] = {
      otp: otpCode,
      status: "OTP_SENT"
    };

    /* ---------- SAVE TO GOOGLE SHEET (ONCE) ---------- */
    await axios.post(GOOGLE_SHEET_URL, {
      name: name || "",
      board: board || "",
      city: city || "",
      course: course || "",
      phone: phoneNumber,
      formName: "VITEEE ONLINE FORM"
    });

    res.json({
      success: true,
      status: "OTP_SENT",
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.error(
      "OTP ERROR:",
      error.response ? error.response.data : error.message
    );

    res.status(500).json({
      success: false,
      message: "OTP sending failed"
    });
  }
});

/* =========================
   7. VERIFY OTP
========================= */
app.post("/verify-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.json({
      success: false,
      message: "Invalid request"
    });
  }

  const record = otpStore[phoneNumber];

  if (!record || record.otp !== otp) {
    return res.json({
      success: false,
      message: "Invalid OTP"
    });
  }

  /* ---------- MARK AS REGISTERED ---------- */
  otpStore[phoneNumber].status = "REGISTERED";

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
