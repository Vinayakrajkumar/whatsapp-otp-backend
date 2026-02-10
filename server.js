async function sendOtp() {
  const phone = "91" + document.getElementById("phone").value.trim();
  // ... validation logic ...
  
  const response = await fetch(`${BACKEND_URL}/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: phone })
  });
  
  if (response.ok) {
    document.getElementById("otpSection").style.display = "block";
    alert("OTP Sent!");
  }
}

async function submitForm() {
  const phone = "91" + document.getElementById("phone").value.trim();
  const enteredOtp = document.getElementById("otpInput").value.trim();

  const response = await fetch(`${BACKEND_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: phone, userOtp: enteredOtp })
  });

  const result = await response.json();
  if (result.success) {
    window.location.href = THANK_YOU_URL;
  } else {
    alert("Invalid OTP code. Please try again.");
  }
}
