import axios from "axios";
import "dotenv/config";

export const sendOtpEmail = async (toEmail, otp) => {
  if (!toEmail) {
    throw new Error("Email is required to send OTP");
  }

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "NexusERP Verification",
          email: process.env.EMAIL_USER || "no-reply@erp.com"
        },
        to: [
          {
            email: toEmail
          }
        ],
        subject: "Your OTP Code",
        htmlContent: `
          <div style="font-family: Arial; padding: 20px;">
            <h2>OTP Verification</h2>
            <p>Your OTP is:</p>
            <h1 style="letter-spacing: 3px;">${otp}</h1>
            <p>This OTP is valid for <b>10 minutes</b>.</p>
            <p>If you did not request this, please ignore.</p>
          </div>
        `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    const errorData = error?.response?.data;
    console.error(
      "❌ [BREVO ERROR]:",
      error?.response?.status || "Unknown Status",
      JSON.stringify(errorData || error.message)
    );

    if (error?.response?.status === 401) {
      console.warn("⚠️ [AUTH ALERT]: Your Brevo API Key may be invalid or expired.");
    } else if (error?.response?.status === 400 || error?.response?.status === 403) {
      console.warn("⚠️ [SENDER ALERT]: Ensure your 'EMAIL_USER' is a VALID VERIFIED SENDER in your Brevo dashboard.");
    }

    // Developer Failsafe: Log the OTP so you can still log in!
    console.log(`\n🔑 [DEVELOPER FALLBACK] OTP for ${toEmail}: ${otp}\n`);
  }
};
