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

// ⚠️ Use ENV in real deploy. Hard-code only for testing.
const NEODOVE_API_KEY = "YOUR_REAL_NEODOVE_API_KEY";

/* ───────── Send OTP (Frontend → Backend → NeoDove) ───────── */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false, message: "Missing data" });
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
          apiKey: NEODOVE_API_KEY        // ✅ REQUIRED LOCATION
        }
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("NEODOVE ERROR STATUS:", err.response?.status);
    console.error("NEODOVE ERROR DATA:", err.response?.data);
    res.status(401).json({ success: false });
  }
});

/* ───────── Start Server ───────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
