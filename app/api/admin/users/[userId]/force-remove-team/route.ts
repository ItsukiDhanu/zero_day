import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { getSessionIdentity, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const sessionUser = await getSessionIdentity(request);

    if (!sessionUser) {
      throw new ApiError(401, "No active session.");
    }

    if (!isAdminRole(sessionUser.role)) {
      throw new ApiError(403, "Only admins can force-remove members.");
    }

    const { userId } = await context.params;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        teamId: true,
      },
    });

    if (!targetUser) {
      throw new ApiError(404, "User not found.");
    }

    if (!targetUser.teamId) {
      return NextResponse.json({
        user: {
          id: targetUser.id,
          email: targetUser.email,
          teamId: null,
        },
        message: "User is not currently assigned to any team.",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { teamId: null },
      select: {
        id: true,
        email: true,
        teamId: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "User removed from team.",
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected force-remove failure." }, { status: 500 });
  }
}
