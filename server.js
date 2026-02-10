const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("OTP Backend Live");
});

const NEODOVE_API_URL =
  "https://backend.api-wa.co/campaign/neodove/api/v2/message/send";

const NEODOVE_API_KEY = process.env.NEODOVE_API_KEY;

app.post("/send-otp", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false });
  }

  try {
    await axios.post(
      NEODOVE_API_URL,
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
          apiKey: NEODOVE_API_KEY   // MUST be a plain API key
        }
      }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("NEODOVE STATUS:", err.response?.status);
    console.error("NEODOVE DATA:", err.response?.data);
    res.status(401).json({ success: false });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
