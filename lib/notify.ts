import nodemailer from "nodemailer";

type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

async function dispatchWithResend({ to, from, apiKey, subject, text, html }: { to: string; from: string; apiKey: string; subject: string; text: string; html?: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend delivery failed: ${res.status} ${body}`);
  }
}

async function dispatchWithGmail({ to, gmailUser, gmailAppPassword, subject, text, html }: { to: string; gmailUser: string; gmailAppPassword: string; subject: string; text: string; html?: string }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: gmailUser,
    to,
    subject,
    text,
    html,
  });
}

export async function sendEmail({ to, subject, text, html }: SendEmailArgs) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();

  const canUseResend = Boolean(resendApiKey && resendFromEmail);
  const canUseGmail = Boolean(gmailUser && gmailAppPassword);

  if (canUseResend && resendApiKey && resendFromEmail) {
    try {
      await dispatchWithResend({ to, from: resendFromEmail, apiKey: resendApiKey, subject, text, html });
      return;
    } catch (err) {
      console.error("[notify] Resend failed, falling back if possible", err);
    }
  }

  if (canUseGmail && gmailUser && gmailAppPassword) {
    try {
      await dispatchWithGmail({ to, gmailUser, gmailAppPassword, subject, text, html });
      return;
    } catch (err) {
      console.error("[notify] Gmail dispatch failed", err);
    }
  }

  // Fallback: log to server console so admins can manual-track
  console.info(`[notify] Email to ${to}: ${subject}\n${text}`);
}

export default sendEmail;
