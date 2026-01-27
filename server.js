const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- 2. HOME PAGE (Health Check) ---
app.get('/', (req, res) => {
    res.send('<h1 style="font-family: Arial;">✅ OTP Backend is Live</h1>');
});

// --- 3. CONFIGURATION ---
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';

/* 🔐 SECURITY: Use process.env.NEODOVE_API_KEY in Render settings 
   for your API key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
*/
const API_KEY = process.env.NEODOVE_API_KEY; 

const CAMPAIGN_NAME = "OTP5"; // Verified campaign name
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyeeCB5b7vcbklHEwZZP-kv6fAxJHkJWAz41qWn0GPlx3KjkpseWXONRH2HpyuXI2Q/exec";

// --- 4. SEND OTP + SAVE DATA ---
app.post('/send-otp', async (req, res) => {
    const { phoneNumber, name, board, city, course, otpCode } = req.body;

    // Basic Validation
    if (!phoneNumber || !otpCode) {
        return res.status(400).json({ success: false, message: "Missing phone or OTP" });
    }

    // Strict Formatting: Ensure "91" prefix for WhatsApp
    let formattedPhone = phoneNumber.replace(/\D/g, "");
    if (formattedPhone.length === 10) {
        formattedPhone = "91" + formattedPhone;
    }

    // NeoDove Payload for otpweb5 template
    const neodovePayload = {
        apiKey: API_KEY,
        campaignName: CAMPAIGN_NAME,
        destination: formattedPhone,
        userName: name || "Student",
        templateParams: [ 
            String(otpCode) // Fills {{1}} in "____ is your verification code"
        ],
        source: "website-otp-form"
    };

    try {
        // Step A: Send WhatsApp Message
        const waResponse = await axios.post(API_URL, neodovePayload);
        console.log("✅ WhatsApp API Status:", waResponse.data);

        // Step B: Save Data to Google Sheets
        await axios.post(GOOGLE_SHEET_URL, {
            name: name || "",
            board: board || "",
            city: city || "",
            course: course || "",
            phone: formattedPhone
        });
        console.log("📊 Lead saved to Google Sheets");

        res.json({ 
            success: true, 
            message: "OTP Sent & Data Saved",
            wa_data: waResponse.data 
        });

    } catch (error) {
        console.error("❌ ERROR:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: "Delivery failed. Check credits or template status." 
        });
    }
});

// --- 5. SERVER START ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
