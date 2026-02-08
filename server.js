const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(cors());

/* =========================
   NEODOVE CONFIG
========================= */
const API_URL =
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

const API_KEY = process.env.NEODOVE_API_KEY; // ✅ FIXED

/* =========================
   IN-MEMORY STORES
========================= */
const otpStore = {};
const registeredUsers = {};

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ OTP Backend is Live");
});

/* =========================
   SEND OTP
========================= */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false });
  }

  if (registeredUsers[phoneNumber]) {
    return res.status(409).json({
      success: false,
      message: "The number you entered is already registered. We will contact you soon."
    });
  }

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
    console.error("Neodove Error:", err.response?.data || err.message);
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
  registeredUsers[phoneNumber] = true;

  res.json({ success: true });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
