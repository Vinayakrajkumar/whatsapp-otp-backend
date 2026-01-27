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
    res.send('<h1 style="font-family: Arial;">🚀 OTP-ONLY Test Mode is Live</h1>');
});

// --- 2. CONFIGURATION ---
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
// SECURE: Pulls from Render environment variables
const API_KEY = process.env.NEODOVE_API_KEY; 
const CAMPAIGN_NAME = "OTP5"; // Working campaign name

// --- 3. OTP SENDING ROUTE (G-SHEETS REMOVED) ---
app.post('/send-otp', async (req, res) => {
    const { phoneNumber, name, otpCode } = req.body;

    if (!phoneNumber || !otpCode) {
        return res.status(400).json({ success: false, message: "Missing phone or OTP" });
    }

    // Format Number for NeoDove (91XXXXXXXXXX)
    let formattedPhone = phoneNumber.replace(/\D/g, "");
    if (formattedPhone.length === 10) {
        formattedPhone = "91" + formattedPhone;
    }

    const neodovePayload = {
        apiKey: API_KEY,
        campaignName: CAMPAIGN_NAME,
        destination: formattedPhone,
        userName: name || "Student",
        templateParams: [ String(otpCode) ], // Fills {{1}} in template
        source: "website-otp-test"
    };

    try {
        // Only sending WhatsApp request now
        const waResponse = await axios.post(API_URL, neodovePayload);
        console.log("✅ WhatsApp Sent:", waResponse.data);

        res.json({ 
            success: true, 
            message: "OTP Sent Successfully", 
            debug: waResponse.data 
        });

    } catch (error) {
        console.error("❌ NeoDove Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Delivery failed" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on port ${PORT}`);
});
