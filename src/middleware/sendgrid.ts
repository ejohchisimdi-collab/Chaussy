// src/email/sendgridService.ts
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

type SendEmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailOptions) => {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL!, // must be verified in SendGrid
      subject,
      text:text!,
      html,
    };

    const response = await sgMail.send(msg);
    return response;
  } catch (error: any) {
    console.error("SendGrid Error:", error.response?.body || error.message);
    throw new Error("Email failed to send");
  }
};