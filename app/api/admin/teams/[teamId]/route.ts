import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { getSessionIdentity, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const sessionUser = await getSessionIdentity(request);

    if (!sessionUser) {
      throw new ApiError(401, "No active session.");
    }

    if (!isAdminRole(sessionUser.role)) {
      throw new ApiError(403, "Only admins can delete teams.");
    }

    const { teamId } = await context.params;

    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!existingTeam) {
      throw new ApiError(404, "Team not found.");
    }

    await prisma.team.delete({
      where: { id: existingTeam.id },
    });

    return NextResponse.json({
      message: `Deleted team ${existingTeam.name}. Members were detached from the team.`,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected team deletion failure." }, { status: 500 });
  }
}
