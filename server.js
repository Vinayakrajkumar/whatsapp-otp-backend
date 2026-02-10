const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

/* ================== CONFIG ================== */

const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";

const API_KEY = String(process.env.NEODOVE_API_KEY || "");
const CAMPAIGN_NAME = String(process.env.NEODOVE_CAMPAIGN_NAME || "");
const SOURCE = String(process.env.NEODOVE_SOURCE || "");

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

/* ================== HELPERS ================== */

function normalizePhone(phone) {
  return String(phone).replace(/[^0-9]/g, "");
}

/* ================== OTP STORE ================== */
/*
{
  "919XXXXXXXXX": {
    otp: "1234",
    expires: timestamp,
    user: { name, board, city, course }
  }
}
*/
const otpStore = {};

/* ================== ROUTES ================== */

app.get("/", (req, res) => {
  res.send("✅ OTP Backend Running");
});

/* ================== SEND OTP ================== */

app.post("/send-otp", async (req, res) => {
  let { phoneNumber, name, board, city, course } = req.body;

  if (!phoneNumber || !name || !board || !city || !course) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  phoneNumber = normalizePhone(phoneNumber);

  // Generate OTP STRICTLY as string
  const otp = String(Math.floor(1000 + Math.random() * 9000));

  otpStore[phoneNumber] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    user: {
      name: String(name),
      board: String(board),
      city: String(city),
      course: String(course)
    }
  };

  try {
    await axios.post(
      API_URL,
      {
        apiKey: API_KEY,
        campaignName: CAMPAIGN_NAME,

        // 🔥 NEODOVE EXPECTS THIS KEY
        destination: phoneNumber,

        // 🔥 NEODOVE EXPECTS THIS KEY
        parameters: [otp],

        source: SOURCE
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(
      "❌ OTP SEND ERROR:",
      err.response?.data || err.message
    );
    res.status(500).json({ success: false });
  }
});

/* ================== VERIFY OTP ================== */

app.post("/verify-otp", async (req, res) => {
  let { phoneNumber, otp } = req.body;

  phoneNumber = normalizePhone(phoneNumber);
  otp = String(otp || "");

  const record = otpStore[phoneNumber];

  if (!record) {
    return res.status(400).json({
      success: false,
      message: "OTP not found"
    });
  }

  if (Date.now() > record.expires) {
    delete otpStore[phoneNumber];
    return res.status(400).json({
      success: false,
      message: "OTP expired"
    });
  }

  if (record.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });
  }

  try {
    // Save to Google Sheet ONLY after verification
    await axios.post(GOOGLE_SHEET_URL, {
      name: record.user.name,
      board: record.user.board,
      city: record.user.city,
      course: record.user.course,
      phone: phoneNumber
    });

    delete otpStore[phoneNumber];
    res.json({ success: true });
  } catch (err) {
    console.error("❌ GOOGLE SHEET ERROR:", err.message);
    res.status(500).json({ success: false });
  }
});

/* ================== SERVER ================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
  console.log("API KEY LOADED:", API_KEY.length > 0);
});
