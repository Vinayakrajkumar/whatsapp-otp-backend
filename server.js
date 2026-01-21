require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Middlewares to handle incoming JSON data and prevent errors
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/* Temporary OTP Storage (In-memory) */
const otpStore = {}; 

/* 1. Updated: Generate 4-digit OTP string */
function generateOTP() {
  // Generates a random number between 1000 and 9999
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/* Helper: Clean Phone Number (Removes '+' and spaces) */
function formatPhone(phone) {
  return phone.replace(/\D/g, ""); 
}

/* ROOT TEST ROUTE - Used for self-ping to wake up the server */
app.get("/", (req, res) => {
  res.send("NeoDove 4-Digit OTP Server is live and awake! ✅");
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
    // 2. NeoDove API Endpoint and Body
    const response = await axios({
      method: 'post',
      url: 'https://backend.api-wa.co/campaign/neodove/api/v2',
      headers: {
        // This 'Bearer' token provides the authorization the server is asking for
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        phoneNumber: formattedPhone,
        templateId: "web_quiz_otpp", // Your specific NeoDove template name
        placeholders: [otp] // 4-digit OTP sent to the {{1}} placeholder
      }
    });

    console.log(`[Success] NeoDove OTP ${otp} sent to ${formattedPhone}`);
    res.json({ success: true, message: "OTP sent successfully" });
    
  } catch (err) {
    // This logs the EXACT reason NeoDove is rejecting the key in your Render logs
    console.error("NEODOVE REJECTION:", err.response?.data || err.message);
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

/* START SERVER & SELF-PING */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
  
  // 3. Self-ping logic to keep Render awake
  const RENDER_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}.onrender.com`;
  
  setInterval(async () => {
    try {
      await axios.get(RENDER_URL || "http://localhost:3000");
      console.log("Keep-alive ping successful.");
    } catch (err) {
      console.error("Keep-alive failed:", err.message);
    }
  }, 600000); // 10 minutes (600,000ms)
});
