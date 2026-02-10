const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const API_URL =
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

const API_KEY = "YOUR_REAL_API_KEY_HERE";

app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false });
  }

  try {
    await axios.post(
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send",
  {
    campaignName: "OTP5",
    templateName: "otpweb5",
    destination: phoneNumber,
    templateParams: [otpCode],
    source: "website-otp-form"
  },
  {
    headers: {
      "Content-Type": "application/json",
      apiKey: API_KEY   // 🔑 MUST be header
    }
  }
);

    res.json({ success: true });
  } catch (err) {
    console.error("LEGACY STATUS:", err.response?.status);
    console.error("LEGACY DATA:", err.response?.data);
    res.status(500).json({ success: false });
  }
});

app.listen(3000, () => {
  console.log("Legacy OTP backend running");
});
