const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors()); // Allows your frontend to talk to this backend

// Your NeoDove Configuration
const API_URL = 'https://backend.api-wa.co/campaign/neodove/api/v2';
// API Key hardcoded as requested
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTcxNjE0OGQyZDk2MGQzZmVhZjNmMSIsIm5hbWUiOiJCWFEgPD4gTWlnaHR5IEh1bmRyZWQgVGVjaG5vbG9naWVzIFB2dCBMdGQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjkxNzE2MTQ4ZDJkOTYwZDNmZWFmM2VhIiwiYWN0aXZlUGxhbiI6Ik5PTkUiLCJpYXQiOjE3NjMxMjA2NjB9.8jOtIkz5c455LWioAa7WNzvjXlqCN564TzM12yQQ5Cw'; 

app.post('/send-otp', async (req, res) => {
    // defaults provided to prevent crashes if frontend sends missing data
    const { phoneNumber, userName, otpCode } = req.body;

    console.log("Received Request:", { phoneNumber, userName, otpCode });

    // 1. Construct the payload
    // IMPORTANT: usage of String(...) ensures numbers are converted to text
    const payload = {
        apiKey: API_KEY,
        campaignName: "Web_Quiz_OTP",
        destination: String(phoneNumber), // Fix 1: Ensure phone is string
        userName: String(userName || "Valued User"),
        templateParams: [
            String(userName || "User") // Fix 2: Ensure param is string
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
                        text: String(otpCode) // Fix 3: Ensure OTP is string (Crucial!)
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

        console.log("NeoDove Success:", response.data);

        // 3. Return success to frontend
        res.json({ success: true, message: "OTP Sent successfully", data: response.data });

    } catch (error) {
        // Detailed error logging
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("NeoDove API Error Response:", error.response.data);
            res.status(500).json({ 
                success: false, 
                message: "Provider Error", 
                details: error.response.data 
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received from NeoDove");
            res.status(500).json({ success: false, message: "No response from OTP provider" });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error("Error setting up request:", error.message);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
