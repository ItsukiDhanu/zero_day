import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { canManageSiteSettings, getSessionIdentity } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EXTRA_SLOT_TEAM_MEMBER_LIMIT } from "@/lib/team-capacity";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionIdentity(request);

    if (!sessionUser) {
      throw new ApiError(401, "No active session.");
    }

    if (!canManageSiteSettings(sessionUser.role)) {
      throw new ApiError(403, "Only organizers and admins can access team management.");
    }

    const teams = await prisma.team.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        joinCode: true,
        extraSlotUnlocked: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
          },
        },
        members: {
          orderBy: { createdAt: "asc" },
          take: EXTRA_SLOT_TEAM_MEMBER_LIMIT,
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        joinCode: team.joinCode,
        createdAt: team.createdAt,
        extraSlotUnlocked: team.extraSlotUnlocked,
        memberCount: team._count.members,
        members: team.members,
      })),
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected admin teams load failure." }, { status: 500 });
  }
}
