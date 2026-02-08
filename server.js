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
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
      <h1 style="color: #28a745;">✅ OTP Backend is Live</h1>
      <p>Your server is running correctly on Render.</p>
      <p>Ready to receive requests at <code>/send-otp</code></p>
    </div>
  `);
});

/* =========================
   3. NEODOVE CONFIGURATION
========================= */
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw";

/* =========================
   4. GOOGLE SHEET URL
========================= */
const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

/* =========================
   5. OTP SENDING ROUTE
========================= */
app.post("/send-otp", async (req, res) => {
  console.log("Request received for:", req.body.phoneNumber);

  const { phoneNumber, userName, otpCode, name, board, city, course } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({
      success: false,
      message: "Required fields (phoneNumber, otpCode) are missing."
    });
  }

  const payload = {
    apiKey: API_KEY,
    campaignName: "OTP5",
    destination: String(phoneNumber),
    userName: String(userName || "Valued User"),
    templateParams: [String(otpCode)],
    source: "website-otp-form",
    media: {},
    buttons: [
      {
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [
          {
            type: "text",
            text: String(otpCode)
          }
        ]
      }
    ],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: { FirstName: "user" }
  };

  try {
    /* ---------- SEND OTP ---------- */
    await axios.post(API_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    /* ---------- SAVE TO GOOGLE SHEET ---------- */
    await axios.post(GOOGLE_SHEET_URL, {
      name: name || "",
      board: board || "",
      city: city || "",
      course: course || "",
      phone: phoneNumber
    });

    res.json({
      success: true,
      message: "OTP sent & data saved to Google Sheet"
    });

  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );

    res.status(500).json({
      success: false,
      message: "OTP or Google Sheet failed"
    });
  }
});

/* =========================
   6. PORT
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
