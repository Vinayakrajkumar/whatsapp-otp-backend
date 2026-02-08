const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

// 1. FIRST: Create the app instance
const app = express();

// 2. SECOND: Apply middleware
app.use(express.json());
app.use(cors());

// 3. THIRD: Define your storage objects
const otpStore = {};
const registeredUsers = {}; // The new storage for verified users

// 4. FOURTH: Define your routes (The "Health Check" must come AFTER app is defined)
app.get("/", (req, res) => {
  res.send("✅ OTP Backend is Live");
});

const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";
const API_KEY = process.env.API_KEY;

app.post("/send-otp", async (req, res) => {
  // ... your send-otp logic ...
});

app.post("/verify-otp", (req, res) => {
  // ... your verify-otp logic ...
});

// 5. FIFTH: Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 OTP server running on port ${PORT}`));
