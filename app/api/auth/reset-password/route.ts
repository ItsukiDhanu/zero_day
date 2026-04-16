import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { hashPassword } from "@/lib/password";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

type ResetPasswordPayload = {
  token?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

function parsePayload(payload: ResetPasswordPayload) {
  const token = typeof payload.token === "string" ? payload.token.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const confirmPassword = typeof payload.confirmPassword === "string" ? payload.confirmPassword : "";

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new ApiError(400, "Reset token is invalid or missing.");
  }

  if (password.length < 8 || password.length > 128) {
    throw new ApiError(400, "Password must be between 8 and 128 characters.");
  }

  if (confirmPassword && password !== confirmPassword) {
    throw new ApiError(400, "Password confirmation does not match.");
  }

  return {
    token,
    password,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = parsePayload((await request.json()) as ResetPasswordPayload);
    const tokenHash = hashPasswordResetToken(payload.token);

    const updateResult = await prisma.user.updateMany({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
      data: {
        passwordHash: hashPassword(payload.password),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    if (updateResult.count === 0) {
      throw new ApiError(400, "Reset token is invalid or has expired.");
    }

    return NextResponse.json({ message: "Password reset successful. You can now login with the new password." });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected reset-password failure." }, { status: 500 });
  }
}
