import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { getSessionIdentity } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSiteSettings } from "@/lib/site-settings";

type JoinTeamPayload = {
  joinCode?: unknown;
  teamName?: unknown;
};

function normalizeTeamName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isWithinSingleEditDistance(a: string, b: string) {
  if (a === b) {
    return true;
  }

  const lenA = a.length;
  const lenB = b.length;

  if (Math.abs(lenA - lenB) > 1) {
    return false;
  }

  let indexA = 0;
  let indexB = 0;
  let edits = 0;

  while (indexA < lenA && indexB < lenB) {
    if (a[indexA] === b[indexB]) {
      indexA += 1;
      indexB += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) {
      return false;
    }

    if (lenA > lenB) {
      indexA += 1;
    } else if (lenB > lenA) {
      indexB += 1;
    } else {
      indexA += 1;
      indexB += 1;
    }
  }

  if (indexA < lenA || indexB < lenB) {
    edits += 1;
  }

  return edits <= 1;
}

type TeamResponse = {
  id: string;
  name: string;
  joinCode: string;
  memberCount: number;
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
  _count: { members: number };
  members: Array<{ id: string; name: string | null; email: string }>;
}): TeamResponse {
  return {
    id: team.id,
    name: team.name,
    joinCode: team.joinCode,
    memberCount: team._count.members,
    members: team.members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      isCaptain: member.id === team.captainId,
    })),
  };
}

function parsePayload(payload: JoinTeamPayload) {
  const joinCode = typeof payload.joinCode === "string" ? payload.joinCode.trim().toUpperCase() : "";
  const teamName = typeof payload.teamName === "string" ? payload.teamName.trim() : "";

  if (!/^[A-Z0-9]{6}$/.test(joinCode)) {
    throw new ApiError(400, "Join code must be 6 uppercase alphanumeric characters.");
  }

  if (!teamName || teamName.length < 2 || teamName.length > 60) {
    throw new ApiError(400, "Team name must be between 2 and 60 characters.");
  }

  return { joinCode, teamName };
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

    const payload = parsePayload((await request.json()) as JoinTeamPayload);

    const joined = await prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { id: true, teamId: true },
      });

      if (!freshUser) {
        throw new ApiError(404, "User not found.");
      }

      const team = await tx.team.findUnique({
        where: { joinCode: payload.joinCode },
        select: { id: true, name: true, joinCode: true },
      });

      if (!team) {
        throw new ApiError(404, "Invalid team code or team name.");
      }

      const normalizedInputTeamName = normalizeTeamName(payload.teamName);
      const normalizedActualTeamName = normalizeTeamName(team.name);
      const teamNameMatches = isWithinSingleEditDistance(normalizedInputTeamName, normalizedActualTeamName);

      if (!teamNameMatches) {
        throw new ApiError(404, "Invalid team code or team name.");
      }

      await tx.$queryRaw`SELECT id FROM "Team" WHERE id = CAST(${team.id} AS UUID) FOR UPDATE`;

      if (freshUser.teamId && freshUser.teamId !== team.id) {
        throw new ApiError(409, "You are already assigned to another team.");
      }

      const currentMemberCount = await tx.user.count({ where: { teamId: team.id } });

      if (!freshUser.teamId && currentMemberCount >= 4) {
        throw new ApiError(409, "Team is at max capacity (4/4).");
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
      });

      if (!hydratedTeam) {
        throw new ApiError(500, "Team could not be loaded.");
      }

      return {
        team: hydratedTeam,
        alreadyMember: Boolean(freshUser.teamId),
      };
    });

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
