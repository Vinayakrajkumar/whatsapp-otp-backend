const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("OTP Backend Live");
});

const API_URL =
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

// 🔴 Hard-code ONLY for testing
const API_KEY = "YOUR_REAL_API_KEY_HERE";

app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false });
  }

  try {
    await axios.post(
      API_URL,
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
          apiKey: API_KEY
        }
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("NEODOVE ERROR:", err.response?.data || err.message);
    res.status(401).json({ success: false });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
