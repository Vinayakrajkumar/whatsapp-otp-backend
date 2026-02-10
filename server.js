const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors()); // Allows your frontend to talk to this backend

// Your NeoDove Configuration
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
// Store this in an Environment Variable in production!
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw'; 

app.post('/send-otp', async (req, res) => {
    const { phoneNumber, userName, otpCode } = req.body;

    // 1. Construct the payload exactly as the CURL request requires
    const payload = {
        apiKey: API_KEY,
        campaignName: "Web_Quiz_OTP",
        destination: phoneNumber, // Dynamic phone number
        userName: userName || "Valued User",
        templateParams: [
            userName || "User" // Parameter 1: Name
        ],
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
                        text: otpCode // DYNAMIC OTP GOES HERE
                    }
                ]
            }
        ],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {
            FirstName: "user"
        }
    };

    try {
        // 2. Send request to NeoDove
        const response = await axios.post(API_URL, payload, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        // 3. Return success to frontend
        res.json({ success: true, message: "OTP Sent successfully", data: response.data });

    } catch (error) {
        console.error("Error sending OTP:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
