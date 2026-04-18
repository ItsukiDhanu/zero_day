import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TeamRepositoryPayload = {
  repositoryUrl?: unknown;
};

const VALID_GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const GITHUB_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;

function normalizeGithubRepositoryUrl(rawValue: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawValue);
  } catch {
    throw new ApiError(400, "Provide a valid GitHub repository URL.");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new ApiError(400, "GitHub repository URL must start with https://.");
  }

  if (!VALID_GITHUB_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
    throw new ApiError(400, "Only github.com repository links are allowed.");
  }

  const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

  if (pathSegments.length < 2) {
    throw new ApiError(400, "GitHub repository URL must include owner and repository name.");
  }

  if (pathSegments.length > 2) {
    throw new ApiError(400, "Use the root repository URL without extra path segments.");
  }

  const owner = pathSegments[0];
  const repositoryName = pathSegments[1].replace(/\.git$/i, "");

  if (!GITHUB_SEGMENT_PATTERN.test(owner) || !GITHUB_SEGMENT_PATTERN.test(repositoryName)) {
    throw new ApiError(400, "GitHub repository URL contains invalid characters.");
  }

  return `https://github.com/${owner}/${repositoryName}`;
}

function parsePayload(payload: TeamRepositoryPayload) {
  const repositoryUrl = typeof payload.repositoryUrl === "string" ? payload.repositoryUrl.trim() : "";

  if (!repositoryUrl) {
    throw new ApiError(400, "GitHub repository link is required.");
  }

  return {
    repositoryUrl: normalizeGithubRepositoryUrl(repositoryUrl),
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      throw new ApiError(401, "No active session.");
    }

    if (!user.teamId) {
      throw new ApiError(409, "Join or create a team before submitting a repository link.");
    }

    const payload = parsePayload((await request.json()) as TeamRepositoryPayload);

    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        id: true,
        captainId: true,
        members: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
          },
        },
      },
    });

    if (!team) {
      throw new ApiError(404, "Team not found.");
    }

    const memberCount = team.members.length;
    if (memberCount < 2 || memberCount > 4) {
      throw new ApiError(409, "Repository link can be submitted only for confirmed teams (2-4 members).");
    }

    const captainId = team.captainId ?? team.members[0]?.id ?? null;
    if (captainId !== user.id) {
      throw new ApiError(403, "Only the team leader can submit or update the repository link.");
    }

    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: { repositoryUrl: payload.repositoryUrl },
      select: {
        repositoryUrl: true,
      },
    });

    return NextResponse.json({
      repositoryUrl: updatedTeam.repositoryUrl,
      message: "Repository link submitted successfully.",
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected repository submission failure." }, { status: 500 });
  }
}
