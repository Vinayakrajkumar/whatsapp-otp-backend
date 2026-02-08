const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
      <h1 style="color: #28a745;">✅ OTP Backend is Live</h1>
      <p>Your server is running correctly on Render.</p>
      <p>Ready to receive requests at <code>/send-otp</code></p>
    </div>
  `);
});

const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";
const API_KEY = "YOUR_API_KEY_HERE";

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode, name, board, city, course } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false });
  }

  const payload = {
    apiKey: API_KEY,
    campaignName: "OTP5",
    destination: phoneNumber,
    templateParams: [otpCode],
    source: "website-otp-form"
  };

  try {
    await axios.post(API_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    await axios.post(GOOGLE_SHEET_URL, {
      name,
      board,
      city,
      course,
      phone: phoneNumber
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
