const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors()); // Allows your frontend to communicate with this backend

// Your NeoDove Configuration
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2/message/send';
// In production, move this to an Environment Variable in Render!
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw'; 

app.post('/send-otp', async (req, res) => {
    const { phoneNumber, userName, otpCode } = req.body;

    // Logging to verify incoming data in Render logs
    console.log(`Sending OTP ${otpCode} to ${phoneNumber}`);

    // Construct the payload based on your API schema
    const payload = {
        apiKey: API_KEY,
        campaignName: "OTP5",
        destination: phoneNumber, 
        userName: userName || "Valued User",
        
        // FIX: Pass otpCode as the first parameter so it replaces {{1}}
        templateParams: [
            otpCode // This will now appear in "___ is your verification code"
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
                        text: otpCode // This makes the 'Copy Code' button work correctly
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
        const response = await axios.post(API_URL, payload, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        res.json({ success: true, message: "OTP Sent successfully", data: response.data });

    } catch (error) {
        // Detailed error logging for debugging
        console.error("Error sending OTP:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
