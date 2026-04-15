import { NextRequest, NextResponse } from "next/server";
import { AcademicYear } from "@prisma/client";
import { ApiError, isApiError } from "@/lib/api-error";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { attachSession } from "@/lib/session";
import { getOrCreateSiteSettings } from "@/lib/site-settings";

type RegisterPayload = {
  name?: unknown;
  year?: unknown;
  branch?: unknown;
  collegeEmail?: unknown;
  phoneNumber?: unknown;
  password?: unknown;
};

const YEAR_MAP: Record<string, AcademicYear> = {
  FIRST_YEAR: "FIRST_YEAR",
  SECOND_YEAR: "SECOND_YEAR",
  "1st Year": "FIRST_YEAR",
  "2nd Year": "SECOND_YEAR",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidAcharyaEmail(email: string) {
  return isValidEmail(email) && email.endsWith("@acharya.ac.in");
}

function parsePayload(payload: RegisterPayload) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const yearValue = typeof payload.year === "string" ? payload.year.trim() : "";
  const branch = typeof payload.branch === "string" ? payload.branch.trim() : "";
  const collegeEmail =
    typeof payload.collegeEmail === "string" ? payload.collegeEmail.trim().toLowerCase() : "";
  const phoneNumberRaw = typeof payload.phoneNumber === "string" ? payload.phoneNumber.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const phoneNumber = phoneNumberRaw.replace(/[\s()-]/g, "");
  const year = YEAR_MAP[yearValue];

  if (!name || name.length < 2 || name.length > 80) {
    throw new ApiError(400, "Name must be between 2 and 80 characters.");
  }

  if (!year) {
    throw new ApiError(400, "Year must be either 1st Year or 2nd Year.");
  }

  if (!branch || branch.length > 80) {
    throw new ApiError(400, "Branch is required and must be 80 characters or fewer.");
  }

  if (!collegeEmail || !isValidAcharyaEmail(collegeEmail)) {
    throw new ApiError(400, "College email must be in the format <name>@acharya.ac.in.");
  }

  if (!phoneNumber || !/^\+?[0-9]{10,15}$/.test(phoneNumber)) {
    throw new ApiError(400, "Phone number must be 10-15 digits and may include a leading +.");
  }

  if (password.length < 8 || password.length > 128) {
    throw new ApiError(400, "Password must be between 8 and 128 characters.");
  }

  return {
    name,
    year,
    branch,
    email: collegeEmail,
    phoneNumber,
    password,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = parsePayload((await request.json()) as RegisterPayload);
    const settings = await getOrCreateSiteSettings();

    if (!settings.registrationOpen) {
      throw new ApiError(403, "Registration is currently closed by organizers.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    const nextPasswordHash = hashPassword(payload.password);

    if (existingUser?.passwordHash && !verifyPassword(payload.password, existingUser.passwordHash)) {
      throw new ApiError(401, "This email is already registered. Use the correct password to update profile.");
    }

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: payload.name,
            year: payload.year,
            branch: payload.branch,
            phoneNumber: payload.phoneNumber,
            passwordHash: nextPasswordHash,
          },
          select: {
            id: true,
            name: true,
            year: true,
            branch: true,
            email: true,
            phoneNumber: true,
            role: true,
            teamId: true,
          },
        })
      : await prisma.user.create({
          data: {
            name: payload.name,
            year: payload.year,
            branch: payload.branch,
            email: payload.email,
            phoneNumber: payload.phoneNumber,
            passwordHash: nextPasswordHash,
          },
          select: {
            id: true,
            name: true,
            year: true,
            branch: true,
            email: true,
            phoneNumber: true,
            role: true,
            teamId: true,
          },
        });

    const response = NextResponse.json({
      user,
      message: "Registration successful.",
    });

    attachSession(response, user.id);
    return response;
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected registration failure." }, { status: 500 });
  }
}
