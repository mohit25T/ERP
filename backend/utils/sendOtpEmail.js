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
    console.error(
      "Brevo email error:",
      error?.response?.data || error.message
    );
    // Developer Failsafe: Log the OTP so you can still log in!
    console.log(`\n🔑 [DEVELOPER ALERT] OTP for ${toEmail}: ${otp}\n`);
    throw new Error("Failed to send OTP email");
  }
};
