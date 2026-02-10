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
 * Do NOT hard-code the key.
 * Set it in Render → Environment Variables
 *
 * KEY   : NEODOVE_API_KEY
 * VALUE : your_real_neodove_api_key
 */
const NEODOVE_API_KEY = process.env.NEODOVE_API_KEY;

/* ───────── Send OTP ───────── */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({
      success: false,
      message: "phoneNumber and otpCode are required"
    });
  }

  // 🔎 Debug log (safe – does NOT print key)
  console.log("SEND OTP REQUEST:", phoneNumber);

  try {
    const response = await axios.post(
      NEODOVE_API_URL,
      {
        campaignName: "OTP5",
        templateName: "otpweb5",
        destination: phoneNumber,      // 91XXXXXXXXXX (no +)
        templateParams: [otpCode],
        source: "website-otp-form"
      },
      {
        headers: {
          "Content-Type": "application/json",
          apiKey: NEODOVE_API_KEY       // ✅ REQUIRED BY NEODOVE
        },
        timeout: 15000
      }
    );

    console.log("NEODOVE SUCCESS:", response.status);
    return res.json({ success: true });

  } catch (err) {
    console.error("NEODOVE ERROR STATUS:", err.response?.status);
    console.error("NEODOVE ERROR DATA:", err.response?.data);
    return res.status(401).json({ success: false });
  }
});

/* ───────── Start Server ───────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
