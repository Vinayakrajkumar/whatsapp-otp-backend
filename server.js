const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- 1. HOME PAGE ---
app.get('/', (req, res) => {
    res.send('<h1 style="font-family: Arial;">✅ OTP Backend is Live</h1>');
});

// --- 2. CONFIGURATION ---
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw';
const CAMPAIGN_NAME = "OTP5"; // Restored to your working campaign
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

// --- 3. OTP SENDING + GOOGLE SHEET ROUTE ---
app.post('/send-otp', async (req, res) => {
    const { phoneNumber, name, board, city, course, otpCode } = req.body;

    // Validate
    if (!phoneNumber || !otpCode) {
        return res.status(400).json({ success: false, message: "Missing phone or OTP" });
    }

    // Format Number for NeoDove (91XXXXXXXXXX)
    let formattedPhone = phoneNumber.replace(/\D/g, "");
    if (formattedPhone.length === 10) formattedPhone = "91" + formattedPhone;

    // --- STEP A: SEND WHATSAPP OTP ---
    const neodovePayload = {
        apiKey: API_KEY,
        campaignName: CAMPAIGN_NAME,
        destination: formattedPhone,
        userName: name || "Student",
        templateParams: [ String(otpCode) ], // Matches {{1}} in "____ is your verification code"
        source: "website-otp-form"
    };

    try {
        // 1. Send WhatsApp
        const waResponse = await axios.post(API_URL, neodovePayload);
        console.log("✅ WhatsApp Sent:", waResponse.data);

        // 2. Save to Google Sheets
        await axios.post(GOOGLE_SHEET_URL, {
            name: name || "",
            board: board || "",
            city: city || "",
            course: course || "",
            phone: formattedPhone
        });
        console.log("📊 Data saved to Sheets");

        res.json({ success: true, message: "OTP Sent & Data Saved" });

    } catch (error) {
        console.error("❌ Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Delivery failed" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
