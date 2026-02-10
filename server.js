const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Legacy OTP Backend Live");
});

// 🔴 OLD LEGACY ENDPOINT
const API_URL = "https://backend.api-wa.co/campaign/neodove/api/v2";

// 🔴 HARD-CODE ONLY FOR TEST
const API_KEY = "YOUR_REAL_NEODOVE_API_KEY";

app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false });
  }

  try {
    await axios.post(API_URL, {
      apiKey: API_KEY,          // 🔴 apiKey IN BODY
      campaignName: "OTP5",
      destination: phoneNumber,
      templateParams: [otpCode],
      source: "website-otp-form"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("LEGACY ERROR:", err.response?.data || err.message);
    res.status(401).json({ success: false });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
