import axios from "axios";
import "dotenv/config";

export const sendOtpEmail = async (toEmail, otp) => {
  if (!toEmail) {
    console.error("❌ [EMAIL ERROR]: No email address provided for OTP. Check user profile.");
    console.log(`\n🔑 [DEVELOPER FALLBACK] OTP Code: ${otp}\n`);
    return;
  }

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "ApexERP Verification",
          email: process.env.EMAIL_USER || "no-reply@erp.com"
        },
        to: [
          {
            email: toEmail
          }
        ],
        subject: `[Apex ERP] Your Verification Code: ${otp}`,
        htmlContent: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center; margin-bottom: 30px; font-weight: 800; text-transform: uppercase; letter-spacing: -1px; font-style: italic;">APEX ERP SYSTEMS</h2>
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
