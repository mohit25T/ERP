import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Sends an email using the Brevo API.
 * @param {string} toEmail 
 * @param {string} toName 
 * @param {string} subject 
 * @param {string} textContent 
 */
export const sendEmail = async (toEmail, toName, subject, textContent) => {
  if (!process.env.BREVO_API_KEY) {
    console.log(`[MOCK EMAIL] To: ${toEmail} | Subject: ${subject} | Content: ${textContent}`);
    return;
  }

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "ERP System", email: "no-reply@erp.com" },
        to: [{ email: toEmail, name: toName }],
        subject: subject,
        textContent: textContent,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );
    console.log("Email sent successfully", response.data);
  } catch (error) {
    console.error("Error sending email via Brevo:", error.response?.data || error.message);
  }
};
