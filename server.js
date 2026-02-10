const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";
const API_KEY = process.env.API_KEY;

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

const otpStore = {}; // { phone: { otp, expires, user } }

app.get("/", (req, res) => {
  res.send("✅ OTP Backend Running");
});

/* ===== SEND OTP ===== */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber, name, board, city, course } = req.body;

  if (!phoneNumber || !name || !board || !city || !course) {
    return res.status(400).json({ success: false });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  otpStore[phoneNumber] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000,
    user: { name, board, city, course }
  };

  try {
    await axios.post(API_URL, {
      apiKey: API_KEY,
      campaignName: "OTP5",
      destination: phoneNumber,
      templateParams: [otp],
      source: "website-form"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("OTP ERROR:", err.response?.data || err.message);
    res.status(500).json({ success: false });
  }
});

/* ===== VERIFY OTP ===== */
app.post("/verify-otp", async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const record = otpStore[phoneNumber];

  if (!record) {
    return res.status(400).json({ success: false });
  }

  if (Date.now() > record.expires || record.otp !== otp) {
    return res.status(400).json({ success: false });
  }

  await axios.post(GOOGLE_SHEET_URL, {
    name: record.user.name,
    board: record.user.board,
    city: record.user.city,
    course: record.user.course,
    phone: phoneNumber
  });

  delete otpStore[phoneNumber];
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running"));
