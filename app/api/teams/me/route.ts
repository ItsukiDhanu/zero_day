import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { getSessionIdentity } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionIdentity(request);

    if (!user) {
      throw new ApiError(401, "No active session.");
    }

    const hydratedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        year: true,
        branch: true,
        phoneNumber: true,
        teamId: true,
        team: {
          select: {
            id: true,
            name: true,
            joinCode: true,
            captainId: true,
            _count: {
              select: {
                members: true,
              },
            },
            members: {
              orderBy: { createdAt: "asc" },
              take: 4,
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!hydratedUser) {
      throw new ApiError(404, "User not found.");
    }

    return NextResponse.json({
      user: {
        id: hydratedUser.id,
        email: hydratedUser.email,
        role: hydratedUser.role,
        name: hydratedUser.name,
        year: hydratedUser.year,
        branch: hydratedUser.branch,
        phoneNumber: hydratedUser.phoneNumber,
        teamId: hydratedUser.teamId,
      },
      team: hydratedUser.team
        ? (() => {
            const captainId = hydratedUser.team.captainId ?? hydratedUser.team.members[0]?.id ?? null;

            return {
              id: hydratedUser.team.id,
              name: hydratedUser.team.name,
              joinCode: hydratedUser.team.joinCode,
              memberCount: hydratedUser.team._count.members,
              members: hydratedUser.team.members.map((member) => ({
                id: member.id,
                name: member.name,
                email: member.email,
                isCaptain: captainId === member.id,
              })),
            };
          })()
        : null,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected session load failure." }, { status: 500 });
  }
}
