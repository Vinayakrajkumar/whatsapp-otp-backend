const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Good practice for Render

const app = express();

// --- THE FIX IS HERE ---
app.use(express.json()); // Reads JSON
app.use(express.urlencoded({ extended: true })); // Reads Form Data (Fixes 'undefined' issue)
app.use(cors());

// Your NeoDove Configuration
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw';

app.post('/send-otp', async (req, res) => {
    // Log the entire body to debug what format is coming in
    console.log("Raw Body:", req.body);

    const { phoneNumber, userName, otpCode } = req.body;

    // Safety Check: Stop if data is missing
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

const PORT = process.env.PORT || 3000; // Render sets its own PORT, so we must use process.env.PORT
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
