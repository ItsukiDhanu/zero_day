import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSiteSettings } from "@/lib/site-settings";
import { generateTeamJoinCode } from "@/lib/team-code";

type CreateTeamPayload = {
  name?: unknown;
};

type TeamMemberResponse = {
  id: string;
  name: string | null;
  email: string;
  isCaptain: boolean;
};

type TeamResponse = {
  id: string;
  name: string;
  joinCode: string;
  memberCount: number;
  members: TeamMemberResponse[];
};

function normalizeTeamName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function parsePayload(payload: CreateTeamPayload) {
  const rawName = typeof payload.name === "string" ? payload.name : "";
  const name = normalizeTeamName(rawName);

  if (!name || name.length < 2 || name.length > 60) {
    throw new ApiError(400, "Team name must be between 2 and 60 characters.");
  }

  return { name };
}

const MAX_CODE_ATTEMPTS = 10;

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      throw new ApiError(401, "Sign in by registering before creating a team.");
    }

    const settings = await getOrCreateSiteSettings();
    if (!settings.registrationOpen) {
      throw new ApiError(403, "Registration is currently closed by organizers.");
    }

    if (user.teamId) {
      throw new ApiError(409, "You are already assigned to a team.");
    }

    const payload = parsePayload((await request.json()) as CreateTeamPayload);

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const joinCode = generateTeamJoinCode();

      try {
        const team = await prisma.$transaction(async (tx) => {
          const freshUser = await tx.user.findUnique({
            where: { id: user.id },
            select: { id: true, teamId: true },
          });

          if (!freshUser) {
            throw new ApiError(404, "User not found.");
          }

          if (freshUser.teamId) {
            throw new ApiError(409, "You are already assigned to a team.");
          }

          const existingTeam = await tx.team.findFirst({
            where: {
              name: {
                equals: payload.name,
                mode: "insensitive",
              },
            },
            select: {
              id: true,
            },
          });

          if (existingTeam) {
            throw new ApiError(409, "Team name already exists. Choose a different name.");
          }

          const createdTeam = await tx.team.create({
            data: {
              name: payload.name,
              joinCode,
              captainId: freshUser.id,
            },
            select: {
              id: true,
              name: true,
              joinCode: true,
              captainId: true,
            },
          });

          await tx.user.update({
            where: { id: freshUser.id },
            data: { teamId: createdTeam.id },
          });

          return {
            id: createdTeam.id,
            name: createdTeam.name,
            joinCode: createdTeam.joinCode,
            memberCount: 1,
            members: [
              {
                id: freshUser.id,
                name: user.name,
                email: user.email,
                isCaptain: true,
              },
            ],
          } satisfies TeamResponse;
        });

        return NextResponse.json({
          team,
          message: "Team created successfully.",
        });
      } catch (error) {
        if (isApiError(error)) {
          throw error;
        }

        const duplicateJoinCode =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          Array.isArray(error.meta?.target) &&
          error.meta.target.includes("join_code");

        const duplicateTeamName =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          Array.isArray(error.meta?.target) &&
          error.meta.target.includes("name");

        if (duplicateJoinCode) {
          continue;
        }

        if (duplicateTeamName) {
          throw new ApiError(409, "Team name already exists. Choose a different name.");
        }

        throw error;
      }
    }

    throw new ApiError(503, "Unable to generate a unique team code. Please retry.");
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected team creation failure." }, { status: 500 });
  }
}
