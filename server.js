require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const otpStore = {}; // phone -> otp

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone required" });

  const otp = generateOTP();
  otpStore[phone] = otp;

  try {
    await axios.post(
      "https://api.gupshup.io/wa/api/v1/template/msg",
      {
        source: process.env.WHATSAPP_SOURCE_NUMBER,
        destination: phone,
        template: {
          id: process.env.WHATSAPP_TEMPLATE_ID,
          params: [otp]
        }
      },
      {
        headers: {
          apikey: process.env.WHATSAPP_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "OTP send failed" });
  }
});

app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  if (otpStore[phone] === otp) {
    delete otpStore[phone];
    return res.json({
      verified: true,
      redirect: process.env.FORMLY_URL
    });
  }

  res.status(401).json({ verified: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
