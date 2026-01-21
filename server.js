const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path'); // Required to fix file paths
require('dotenv').config(); 

const app = express();

// --- MIDDLEWARE ---
app.use(express.json()); // Reads JSON body
app.use(express.urlencoded({ extended: true })); // Reads Form Data
app.use(cors()); // Allows frontend access

// --- FIX FOR "CANNOT GET /" ERROR ---
// 1. If you have an index.html in a 'public' folder, this serves it:
app.use(express.static(path.join(__dirname, 'public')));

// 2. If no file is found, this message appears instead of the error:
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>✅ Backend is Live!</h1>
            <p>Your OTP Server is running successfully.</p>
            <p>Send POST requests to: <code>/send-otp</code></p>
        </div>
    `);
});

// --- NEODOVE CONFIGURATION ---
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw';

// --- OTP ROUTE ---
app.post('/send-otp', async (req, res) => {
    console.log("Raw Body:", req.body); // Debug log

    const { phoneNumber, userName, otpCode } = req.body;

    // Safety Check
    if (!phoneNumber || !otpCode) {
        console.error("Missing Data! Phone or OTP is empty.");
        return res.status(400).json({ 
            success: false, 
            message: "Data missing. Make sure you are sending phoneNumber and otpCode." 
        });
    }

    const payload = {
        apiKey: API_KEY,
        campaignName: "Web_Quiz_OTP",
        destination: String(phoneNumber),
        userName: String(userName || "Valued User"),
        templateParams: [ String(userName || "User") ],
        source: "new-landing-page form",
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
        const response = await axios.post(API_URL, payload, {
            headers: { "Content-Type": "application/json" }
        });
        console.log("Success:", response.data);
        res.json({ success: true, message: "OTP Sent successfully", data: response.data });

    } catch (error) {
        console.error("NeoDove Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
});

// --- SERVER START ---
// Render assigns a port automatically using process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
