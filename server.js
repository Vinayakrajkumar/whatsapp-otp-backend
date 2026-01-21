require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Middlewares to handle incoming JSON data and prevent 415 errors
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/* Temporary OTP Storage (In-memory) */
const otpStore = {}; 

/* 1. Updated: Generate 5-digit OTP string */
function generateOTP() {
  // Generates a random number between 10000 and 99999
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/* Helper: Clean Phone Number (Removes '+' and spaces) */
function formatPhone(phone) {
  return phone.replace(/\D/g, ""); 
}

/* ROOT TEST ROUTE - Used for self-ping to wake up the server */
app.get("/", (req, res) => {
  res.send("NeoDove 5-Digit OTP Server is live and awake! ✅");
});

/* SEND OTP via NeoDove */
app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }

  const formattedPhone = formatPhone(phone);
  const otp = generateOTP();
  otpStore[formattedPhone] = otp;

  try {
    // NeoDove strictly requires "application/json" and "Bearer" token
    const response = await axios({
      method: 'post',
      url: 'https://connect.neodove.com/api/v1/whatsapp/send-template',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        phoneNumber: formattedPhone,
        templateId: "web_quiz_otpp",
        placeholders: [otp] // Correct Array format for single placeholder {{1}}
      }
    });

    console.log(`[Success] OTP ${otp} sent to ${formattedPhone}`);
    res.json({ success: true, message: "OTP sent successfully" });
    
  } catch (err) {
    // Log the specific rejection reason from NeoDove
    console.error("NEODOVE ERROR:", err.response?.data || err.message);
    res.status(500).json({ 
        error: "Failed to send OTP", 
        details: err.response?.data 
    });
  }
});

/* VERIFY OTP */
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  const formattedPhone = formatPhone(phone);

  if (otpStore[formattedPhone] && otpStore[formattedPhone] === otp) {
    delete otpStore[formattedPhone]; // Remove used OTP
    return res.json({
      verified: true,
      redirect: process.env.FORMLY_URL
    });
  }

  res.status(401).json({ verified: false, message: "Invalid or expired OTP" });
});

/* START SERVER */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
  
  // 2. SELF-PING: Reset Render's 15-minute inactivity timer every 10 minutes
  const RENDER_EXTERNAL_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}.onrender.com`;
  
  setInterval(async () => {
    try {
      // Use the actual URL of your deployed app
      await axios.get(RENDER_EXTERNAL_URL || "http://localhost:3000");
      console.log("Self-ping successful: Service kept awake.");
    } catch (err) {
      console.error("Self-ping failed:", err.message);
    }
  }, 600000); // 10 minutes (600,000ms)
});
