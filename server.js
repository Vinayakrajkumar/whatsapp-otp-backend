require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Middlewares to handle incoming JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/* Temporary OTP Storage (In-memory) */
const otpStore = {}; 

/* 1. Generate 5-digit OTP string */
function generateOTP() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/* Helper: Clean Phone Number */
function formatPhone(phone) {
  return phone.replace(/\D/g, ""); 
}

/* ROOT TEST ROUTE */
app.get("/", (req, res) => {
  res.send("AiSensy 5-Digit OTP Server is live and awake! ✅");
});

/* SEND OTP via AiSensy API */
app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }

  const formattedPhone = formatPhone(phone);
  const otp = generateOTP();
  otpStore[formattedPhone] = otp;

  try {
    // UPDATED: Talking directly to AiSensy API v2
    const response = await axios({
      method: 'post',
      url: 'https://backend.aisensy.com/campaign/t1/api/v2',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        apiKey: process.env.WHATSAPP_API_KEY, // The long key starting with eyJ...
        campaignName: "web_quiz_otpp", // This MUST match your campaign name exactly
        destination: formattedPhone,
        userName: "User",
        template: {
          templateName: "web_quiz_otpp", // The Template ID you provided
          languageCode: "en",
          bodyValues: [otp] // Fills the {{1}} in your template
        }
      }
    });

    console.log(`[Success] OTP ${otp} sent via AiSensy to ${formattedPhone}`);
    res.json({ success: true, message: "OTP sent successfully" });
    
  } catch (err) {
    // Detailed error logging to fix any remaining issues in Render
    console.error("AISENSY REJECTION:", err.response?.data || err.message);
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
    delete otpStore[formattedPhone];
    return res.json({
      verified: true,
      redirect: process.env.FORMLY_URL
    });
  }

  res.status(401).json({ verified: false, message: "Invalid or expired OTP" });
});

/* START SERVER & SELF-PING */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
  
  // Self-ping logic to keep Render awake
  const RENDER_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}.onrender.com`;
  
  setInterval(async () => {
    try {
      await axios.get(RENDER_URL || "http://localhost:3000");
      console.log("Keep-alive ping successful.");
    } catch (err) {
      console.error("Keep-alive failed:", err.message);
    }
  }, 600000); // 10 minutes
});
