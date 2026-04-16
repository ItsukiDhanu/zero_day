import { createHash, randomBytes } from "node:crypto";

const PASSWORD_RESET_TTL_MINUTES = 30;

export type PasswordResetDispatchResult = "sent" | "logged";

export function createPasswordResetToken() {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt,
  };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetBaseUrl(fallbackOrigin: string) {
  const configuredBase = process.env.PASSWORD_RESET_BASE_URL?.trim();

  if (!configuredBase) {
    return fallbackOrigin;
  }

  return configuredBase.replace(/\/+$/, "");
}

export function buildPasswordResetUrl(baseUrl: string, token: string) {
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function dispatchPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}): Promise<PasswordResetDispatchResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!resendApiKey || !resendFromEmail) {
    console.info(`[password-reset] Reset link for ${to}: ${resetUrl}`);
    return "logged";
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to,
      subject: "Zero_Day password reset",
      text: `Use this link to reset your Zero_Day password (valid for ${PASSWORD_RESET_TTL_MINUTES} minutes): ${resetUrl}`,
      html: `<p>Use this link to reset your Zero_Day password (valid for ${PASSWORD_RESET_TTL_MINUTES} minutes):</p><p><a href=\"${resetUrl}\">${resetUrl}</a></p>`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new Error(`Resend email dispatch failed: ${response.status} ${errorBody}`);
  }

  return "sent";
}
