// ... existing imports ...

const otpStore = {};
const registeredUsers = {}; // New: Store verified numbers here

/* =========================
   SEND OTP (Updated)
========================= */
app.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Phone required" });
  }

  // CHECK IF ALREADY REGISTERED
  if (registeredUsers[phoneNumber]) {
    return res.status(409).json({ 
      success: false, 
      alreadyRegistered: true, 
      message: "Already registered" 
    });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phoneNumber] = otp;

  // ... rest of your Neodove axios call ...
  try {
    await axios.post(API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* =========================
   VERIFY OTP (Updated)
========================= */
app.post("/verify-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (otpStore[phoneNumber] === otp) {
    delete otpStore[phoneNumber];
    
    // SAVE TO REGISTERED USERS
    registeredUsers[phoneNumber] = true; 
    
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});
