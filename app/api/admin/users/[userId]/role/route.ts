import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { getSessionIdentity, invalidateSessionIdentityCache, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RolePatchPayload = {
  role?: unknown;
};

function parseRole(payload: RolePatchPayload) {
  if (typeof payload.role !== "string") {
    throw new ApiError(400, "Role is required.");
  }

  if (!(payload.role in UserRole)) {
    throw new ApiError(400, "Role must be one of PARTICIPANT, ORGANIZER, or ADMIN.");
  }

  return payload.role as UserRole;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const sessionUser = await getSessionIdentity(request);

    if (!sessionUser) {
      throw new ApiError(401, "No active session.");
    }

    if (!isAdminRole(sessionUser.role)) {
      throw new ApiError(403, "Only admins can update user roles.");
    }

    const { userId } = await context.params;
    const role = parseRole((await request.json()) as RolePatchPayload);

    if (sessionUser.id === userId && role !== "ADMIN") {
      throw new ApiError(409, "Admins cannot demote themselves.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    invalidateSessionIdentityCache(updatedUser.id);

    return NextResponse.json({
      user: updatedUser,
      message: `Updated role to ${updatedUser.role}.`,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected role update failure." }, { status: 500 });
  }
}
