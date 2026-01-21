require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const otpStore = {}; 

/* 1. Updated: 4-digit OTP */
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function formatPhone(phone) {
  return phone.replace(/\D/g, ""); 
}

app.get("/", (req, res) => {
  res.send("NeoDove 4-Digit OTP Server is running! ✅");
});

/* SEND OTP via NeoDove */
app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });

  const formattedPhone = formatPhone(phone);
  const otp = generateOTP();
  otpStore[formattedPhone] = otp;

  try {
    // 2. NeoDove API Endpoint and Body
    const response = await axios({
      method: 'post',
      url: 'https://connect.neodove.com/api/v1/whatsapp/send-template',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        phoneNumber: formattedPhone,
        templateId: "web_quiz_otpp", // Your specific NeoDove template name
        placeholders: [otp] // Correct Array format for placeholders
      }
    });

    console.log(`[NeoDove] OTP ${otp} sent to ${formattedPhone}`);
    res.json({ success: true, message: "OTP sent successfully" });
    
  } catch (err) {
    console.error("NEODOVE REJECTION:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to send OTP", details: err.response?.data });
  }
});

/* VERIFY OTP */
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  const formattedPhone = formatPhone(phone);

  if (otpStore[formattedPhone] && otpStore[formattedPhone] === otp) {
    delete otpStore[formattedPhone];
    return res.json({ verified: true, redirect: process.env.FORMLY_URL });
  }
  res.status(401).json({ verified: false, message: "Invalid or expired OTP" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
  
  // Keep Render awake
  const RENDER_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}.onrender.com`;
  setInterval(async () => {
    try {
      await axios.get(RENDER_URL || "http://localhost:3000");
    } catch (err) {}
  }, 600000);
});
