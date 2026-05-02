import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { canAccessJudging, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isConfirmedTeamSize } from "@/lib/team-capacity";

const MAX_CRITERION_SCORE = 20;

type TeamJudgingScoreUpsertResult = {
  innovationScore: number;
  impactScore: number;
  implementationScore: number;
  presentationScore: number;
  ruleAdherenceScore: number;
  comments: string | null;
  updatedByEmail: string | null;
  updatedAt: Date;
};

function displayUserName(name: string | null, email: string) {
  if (name?.trim()) {
    return name.trim();
  }

  const emailPrefix = email.split("@")[0]?.trim();
  return emailPrefix || email;
}

const prismaWithJudging = prisma as typeof prisma & {
  teamJudgingScore: {
    upsert: (args: unknown) => Promise<TeamJudgingScoreUpsertResult>;
  };
};

type JudgingPatchPayload = {
  teamId?: unknown;
  innovationScore?: unknown;
  impactScore?: unknown;
  implementationScore?: unknown;
  presentationScore?: unknown;
  ruleAdherenceScore?: unknown;
  comments?: unknown;
};

function parseCriterionScore(label: string, value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ApiError(400, `${label} must be an integer between 0 and ${MAX_CRITERION_SCORE}.`);
  }

  if (value < 0 || value > MAX_CRITERION_SCORE) {
    throw new ApiError(400, `${label} must be between 0 and ${MAX_CRITERION_SCORE}.`);
  }

  return value;
}

function parsePayload(payload: JudgingPatchPayload) {
  const teamId = typeof payload.teamId === "string" ? payload.teamId.trim() : "";

  if (!teamId) {
    throw new ApiError(400, "teamId is required.");
  }

  const commentsRaw = typeof payload.comments === "string" ? payload.comments.trim() : "";

  if (commentsRaw.length > 1000) {
    throw new ApiError(400, "comments must be at most 1000 characters.");
  }

  return {
    teamId,
    innovationScore: parseCriterionScore("innovationScore", payload.innovationScore),
    impactScore: parseCriterionScore("impactScore", payload.impactScore),
    implementationScore: parseCriterionScore("implementationScore", payload.implementationScore),
    presentationScore: parseCriterionScore("presentationScore", payload.presentationScore),
    ruleAdherenceScore: parseCriterionScore("ruleAdherenceScore", payload.ruleAdherenceScore),
    comments: commentsRaw || null,
  };
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      throw new ApiError(401, "No active session.");
    }

    if (!canAccessJudging(user.role)) {
      throw new ApiError(403, "Only judges, organizers, and admins can submit judging marks.");
    }

    const payload = parsePayload((await request.json()) as JudgingPatchPayload);

    const team = await prisma.team.findUnique({
      where: { id: payload.teamId },
      select: {
        id: true,
        extraSlotUnlocked: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!team) {
      throw new ApiError(404, "Team not found.");
    }

    if (!isConfirmedTeamSize(team._count.members, team.extraSlotUnlocked)) {
      throw new ApiError(409, "Only confirmed teams (2-5 members) can be judged.");
    }

    const judging = await prismaWithJudging.teamJudgingScore.upsert({
      where: { teamId: payload.teamId },
      create: {
        teamId: payload.teamId,
        innovationScore: payload.innovationScore,
        impactScore: payload.impactScore,
        implementationScore: payload.implementationScore,
        presentationScore: payload.presentationScore,
        ruleAdherenceScore: payload.ruleAdherenceScore,
        comments: payload.comments,
        updatedByEmail: user.email,
      },
      update: {
        innovationScore: payload.innovationScore,
        impactScore: payload.impactScore,
        implementationScore: payload.implementationScore,
        presentationScore: payload.presentationScore,
        ruleAdherenceScore: payload.ruleAdherenceScore,
        comments: payload.comments,
        updatedByEmail: user.email,
      },
      select: {
        innovationScore: true,
        impactScore: true,
        implementationScore: true,
        presentationScore: true,
        ruleAdherenceScore: true,
        comments: true,
        updatedByEmail: true,
        updatedAt: true,
      },
    });

    const totalScore =
      judging.innovationScore +
      judging.impactScore +
      judging.implementationScore +
      judging.presentationScore +
      judging.ruleAdherenceScore;

    const updatedByName = displayUserName(user.name, user.email);

    return NextResponse.json({
      message: "Judging marks saved.",
      judging: {
        ...judging,
        updatedByName,
        totalScore,
      },
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected judging update failure." }, { status: 500 });
  }
}
