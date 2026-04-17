import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ApiError, isApiError } from "@/lib/api-error";
import { canManageSiteSettings, getSessionIdentity } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionIdentity(request);

    if (!sessionUser) {
      throw new ApiError(401, "No active session.");
    }

    if (!canManageSiteSettings(sessionUser.role)) {
      throw new ApiError(403, "Only organizers and admins can access user management.");
    }

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (!query) {
      return NextResponse.json({
        users: [],
        teamsById: {},
      });
    }

    if (query.length < 2) {
      throw new ApiError(400, "Enter at least 2 characters to search users.");
    }

    const phoneQuery = query.replace(/[^0-9]/g, "");

    const whereClauses: Prisma.UserWhereInput[] = [
      {
        email: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
    ];

    if (phoneQuery.length >= 3) {
      whereClauses.push({
        phoneNumber: {
          contains: phoneQuery,
        },
      });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: whereClauses,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        year: true,
        branch: true,
        phoneNumber: true,
        createdAt: true,
        teamId: true,
      },
    });

    const uniqueTeamIds = Array.from(new Set(users.map((user) => user.teamId).filter(Boolean))) as string[];

    const teams = uniqueTeamIds.length
      ? await prisma.team.findMany({
          where: {
            id: {
              in: uniqueTeamIds,
            },
          },
          select: {
            id: true,
            name: true,
            joinCode: true,
          },
        })
      : [];

    const teamsById = Object.fromEntries(
      teams.map((team) => [
        team.id,
        {
          id: team.id,
          name: team.name,
          joinCode: team.joinCode,
        },
      ]),
    );

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        branch: user.branch,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
        teamId: user.teamId,
      })),
      teamsById,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected admin users load failure." }, { status: 500 });
  }
}
