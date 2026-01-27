const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

/* =========================
   1. MIDDLEWARE
========================= */
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses form-submitted data
app.use(cors()); // Allows your website to communicate with this server

/* =========================
   2. HEALTH CHECK (FIX FOR CANNOT GET /)
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

// If you have an 'index.html' file in a 'public' folder, uncomment below
// app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   3. NEODOVE CONFIGURATION
========================= */
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";

const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw";

/* =========================
   4. OTP SENDING ROUTE
========================= */
app.post("/send-otp", async (req, res) => {
  console.log("Request received for:", req.body.phoneNumber);

  const { phoneNumber, userName, otpCode } = req.body;

  // Validate incoming data
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
            text: String(otpCode) // Dynamic OTP
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
    const response = await axios.post(API_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    res.json({
      success: true,
      message: "OTP sent successfully via WhatsApp",
      neodove_response: response.data
    });

  } catch (error) {
    console.error(
      "NeoDove API Error:",
      error.response ? error.response.data : error.message
    );

    res.status(500).json({
      success: false,
      message: "NeoDove API failed to send message."
    });
  }
});

/* =========================
   5. RENDER PORT BINDING
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
