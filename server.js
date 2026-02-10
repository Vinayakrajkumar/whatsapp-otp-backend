const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

/* ───────── Middleware ───────── */
app.use(express.json());
app.use(cors());

/* ───────── Health Check ───────── */
app.get("/", (req, res) => {
  res.send("✅ OTP Backend Live");
});

/* ───────── NeoDove Config ───────── */
const NEODOVE_API_URL =
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

/**
 * IMPORTANT:
 * Set this in Render → Environment Variables
 * KEY   : NEODOVE_API_KEY
 * VALUE : <your NEW api key>
 */
const NEODOVE_API_KEY = process.env.NEODOVE_API_KEY;

if (!NEODOVE_API_KEY) {
  throw new Error("❌ NEODOVE_API_KEY is missing in environment variables");
}

/* ───────── Send OTP ───────── */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({
      success: false,
      message: "phoneNumber and otpCode are required"
    });
  }

  try {
    await axios.post(
      NEODOVE_API_URL,
      {
        campaignName: "OTP5",
        templateName: "otpweb5",
        destination: phoneNumber,        // 91XXXXXXXXXX (no +)
        templateParams: [otpCode],       // frontend-generated OTP
        source: "website-otp-form"
      },
      {
        headers: {
  "Content-Type": "application/json",
  "X-API-KEY": process.env.NEODOVE_API_KEY
}
        }
      }
    );

    return res.json({ success: true });

  } catch (err) {
    console.error("NEODOVE STATUS:", err.response?.status);
    console.error("NEODOVE DATA:", err.response?.data);
    return res.status(401).json({ success: false });
  }
});

/* ───────── Start Server ───────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
