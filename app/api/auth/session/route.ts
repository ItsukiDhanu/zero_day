import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSession, readSessionUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = readSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ user: null, team: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    const response = NextResponse.json({ user: null, team: null });
    clearSession(response);
    return response;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      year: user.year,
      branch: user.branch,
      phoneNumber: user.phoneNumber,
      teamId: user.teamId,
    },
    team: user.team
      ? (() => {
          const captainId = user.team.captainId ?? user.team.members[0]?.id ?? null;

          return {
            id: user.team.id,
            name: user.team.name,
            joinCode: user.team.joinCode,
            memberCount: user.team._count.members,
            members: user.team.members.map((member) => ({
              id: member.id,
              name: member.name,
              email: member.email,
              isCaptain: captainId === member.id,
            })),
          };
        })()
      : null,
  });
}
