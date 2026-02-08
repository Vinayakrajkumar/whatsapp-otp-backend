const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

/* =========================
   HEALTH CHECK
========================= */ 
app.get("/", (req, res) => {
  res.send("✅ OTP Backend is Live");
});

/* =========================
   NEODOVE CONFIG (CORRECT)
========================= */
const API_URL =
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

const API_KEY = process.env.API_KEY;

/* =========================
   IN-MEMORY OTP STORE
========================= */
const otpStore = {};

/* =========================
   SEND OTP
========================= */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false });
  }

  // 🔐 generate OTP in backend
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phoneNumber] = otp;

  const payload = {
    campaignName: "OTP5",
    templateName: "otpweb5",
    destination: phoneNumber,
    templateParams: [otp],
    source: "website-otp-form"
  };

  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      }
    });

    console.log("Neodove response:", response.data);

    res.json({ success: true });
  } catch (err) {
    console.error("Neodove ERROR:", err.response?.data || err.message);
    res.status(500).json({ success: false });
  }
});

/* =========================
   VERIFY OTP
========================= */
app.post("/verify-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (otpStore[phoneNumber] !== otp) {
    return res.json({ success: false });
  }

  delete otpStore[phoneNumber];
  res.json({ success: true });
});

/* =========================
   PORT
========================= */
app.listen(3000, () =>
  console.log("🚀 OTP server running")
);
