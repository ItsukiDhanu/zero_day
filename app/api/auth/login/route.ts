import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { attachSession } from "@/lib/session";

type LoginPayload = {
  email?: unknown;
  password?: unknown;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parsePayload(payload: LoginPayload) {
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !isValidEmail(email)) {
    throw new ApiError(400, "A valid college email address is required.");
  }

  if (password.length < 8 || password.length > 128) {
    throw new ApiError(400, "Password must be between 8 and 128 characters.");
  }

  return {
    email,
    password,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = parsePayload((await request.json()) as LoginPayload);

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        name: true,
        year: true,
        branch: true,
        email: true,
        phoneNumber: true,
        passwordHash: true,
        role: true,
        teamId: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "Account not found. Please register first.");
    }

    if (!user.passwordHash) {
      throw new ApiError(409, "This account has no password set. Re-register with a password first.");
    }

    if (!verifyPassword(payload.password, user.passwordHash)) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        year: user.year,
        branch: user.branch,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        teamId: user.teamId,
      },
      message: "Login successful.",
    });

    attachSession(response, user.id);
    return response;
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected login failure." }, { status: 500 });
  }
}
