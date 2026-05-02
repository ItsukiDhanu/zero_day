import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { ApiError, isApiError } from "@/lib/api-error";
import { getSessionIdentity } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSiteSettings } from "@/lib/site-settings";
import { EXTRA_SLOT_TEAM_MEMBER_LIMIT, getTeamMemberLimit } from "@/lib/team-capacity";

type JoinLinkPayload = {
  joinLink?: unknown;
};

type TeamResponse = {
  id: string;
  name: string;
  joinCode: string;
  memberCount: number;
  extraSlotUnlocked: boolean;
  members: Array<{
    id: string;
    name: string | null;
    email: string;
    isCaptain: boolean;
  }>;
};

function mapTeamResponse(team: {
  id: string;
  name: string;
  joinCode: string;
  captainId: string | null;
  extraSlotUnlocked: boolean;
  _count: { members: number };
  members: Array<{ id: string; name: string | null; email: string }>;
}): TeamResponse {
  return {
    id: team.id,
    name: team.name,
    joinCode: team.joinCode,
    memberCount: team._count.members,
    extraSlotUnlocked: team.extraSlotUnlocked,
    members: team.members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      isCaptain: member.id === team.captainId,
    })),
  };
}

function parsePayload(payload: JoinLinkPayload) {
  const joinLink = typeof payload.joinLink === "string" ? payload.joinLink.trim().toLowerCase() : "";

  if (!joinLink || !/^[a-z0-9]{24}$/.test(joinLink)) {
    throw new ApiError(400, "Invalid join link.");
  }

  return { joinLink };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionIdentity(request);
    if (!user) {
      throw new ApiError(401, "Sign in by registering before joining a team.");
    }

    const settings = await getOrCreateSiteSettings();
    if (!settings.registrationOpen) {
      throw new ApiError(403, "Registration is currently closed by organizers.");
    }

    const payload = parsePayload((await request.json()) as JoinLinkPayload);

    const joined = await prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { id: true, teamId: true },
      });

      if (!freshUser) {
        throw new ApiError(404, "User not found.");
      }

      const team = await tx.team.findUnique({
        where: { joinLink: payload.joinLink },
        select: {
          id: true,
          name: true,
          joinCode: true,
          extraSlotUnlocked: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!team) {
        throw new ApiError(404, "Invalid join link or team not found.");
      }

      // Lock the team row for update
      await tx.$queryRaw`SELECT id FROM "Team" WHERE id = CAST(${team.id} AS UUID) FOR UPDATE`;

      if (freshUser.teamId && freshUser.teamId !== team.id) {
        throw new ApiError(409, "You are already assigned to another team.");
      }

      const currentMemberCount = await tx.user.count({ where: { teamId: team.id } });
      const memberLimit = getTeamMemberLimit(team.extraSlotUnlocked);

      if (!freshUser.teamId && currentMemberCount >= memberLimit) {
        throw new ApiError(409, `Team is at max capacity (${memberLimit}/${memberLimit}).`);
      }

      if (!freshUser.teamId) {
        await tx.user.update({
          where: { id: freshUser.id },
          data: { teamId: team.id },
        });
      }

      const hydratedTeam = await tx.team.findUnique({
        where: { id: team.id },
        select: {
          id: true,
          name: true,
          joinCode: true,
          captainId: true,
          extraSlotUnlocked: true,
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

      if (!hydratedTeam) {
        throw new ApiError(500, "Team could not be loaded.");
      }

      return {
        team: hydratedTeam,
        alreadyMember: Boolean(freshUser.teamId),
      };
    });

    revalidateTag("confirmed-teams");

    return NextResponse.json({
      team: mapTeamResponse(joined.team),
      message: joined.alreadyMember ? "You are already part of this team." : "Team join successful.",
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected team join failure." }, { status: 500 });
  }
}
