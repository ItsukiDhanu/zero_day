"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { ApiError, isApiError } from "@/lib/api-error";
import { decodeSessionToken } from "@/lib/session";
import { isTeamPaymentVerified } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSiteSettings } from "@/lib/site-settings";

type RepositorySubmissionState = {
  message?: string;
  error?: string;
  repositoryUrl?: string | null;
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

function parsePayload(formData: FormData) {
  const rawValue = formData.get("repositoryUrl");
  const repositoryUrl = typeof rawValue === "string" ? rawValue.trim() : "";

  if (!repositoryUrl) {
    throw new ApiError(400, "GitHub repository link is required.");
  }

  return {
    repositoryUrl: normalizeGithubRepositoryUrl(repositoryUrl),
  };
}

export async function submitTeamRepositoryAction(
  _previousState: RepositorySubmissionState,
  formData: FormData,
): Promise<RepositorySubmissionState> {
  try {
    const sessionCookieStore = await cookies();
    const sessionToken = sessionCookieStore.get("zd_session")?.value;
    const userId = decodeSessionToken(sessionToken);

    if (!userId) {
      throw new ApiError(401, "No active session.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        teamId: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "No active session.");
    }

    if (!user.teamId) {
      throw new ApiError(409, "Join or create a team before submitting a repository link.");
    }

    const settings = await getOrCreateSiteSettings();
    if (!settings.repositorySubmissionOpen) {
      throw new ApiError(403, "Repository submission is currently closed by organizers.");
    }

    const paymentVerified = await isTeamPaymentVerified(user.teamId);
    if (!paymentVerified) {
      throw new ApiError(402, "Team registration payment must be verified before submitting repository.");
    }

    const payload = parsePayload(formData);

    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        id: true,
        captainId: true,
        extraSlotUnlocked: true,
        _count: {
          select: {
            members: true,
          },
        },
        members: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            id: true,
          },
        },
      },
    });

    if (!team) {
      throw new ApiError(404, "Team not found.");
    }

    const memberCount = team._count.members;
    const maxMembers = team.extraSlotUnlocked ? 5 : 4;

    if (memberCount < 2 || memberCount > maxMembers) {
      throw new ApiError(409, `Repository link can be submitted only for confirmed teams (2-${maxMembers} members).`);
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

    revalidateTag("confirmed-teams");

    return {
      repositoryUrl: updatedTeam.repositoryUrl,
      message: "Repository link submitted successfully.",
    };
  } catch (error) {
    if (isApiError(error)) {
      return { error: error.message };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: "Repository submission failed due to a database error." };
    }

    return { error: "Unexpected repository submission failure." };
  }
}