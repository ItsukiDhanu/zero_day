import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  dispatchPasswordResetEmail,
  getPasswordResetBaseUrl,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

type ForgotPasswordPayload = {
  email?: unknown;
};

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  "If an account exists for this email, a password reset link will be sent shortly.";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parsePayload(payload: ForgotPasswordPayload) {
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  return { email };
}

export async function POST(request: NextRequest) {
  try {
    const payload = parsePayload((await request.json()) as ForgotPasswordPayload);

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        email: true,
      },
    });

    let previewResetUrl: string | undefined;

    if (user) {
      const { token, tokenHash, expiresAt } = createPasswordResetToken();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const resetBaseUrl = getPasswordResetBaseUrl(request.nextUrl.origin);
      const resetUrl = buildPasswordResetUrl(resetBaseUrl, token);

      try {
        await dispatchPasswordResetEmail({
          to: user.email,
          resetUrl,
        });
      } catch (error) {
        console.error("[password-reset] Email dispatch failed", error);
      }

      if (process.env.NODE_ENV !== "production") {
        previewResetUrl = resetUrl;
      }
    }

    return NextResponse.json({
      message: GENERIC_FORGOT_PASSWORD_MESSAGE,
      previewResetUrl,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected forgot-password failure." }, { status: 500 });
  }
}
