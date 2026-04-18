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
      throw new ApiError(403, "Only organizers and admins can access user suggestions.");
    }

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
      throw new ApiError(400, "Enter at least 2 characters to search suggestions.");
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
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
      },
      take: 12,
    });

    return NextResponse.json({
      suggestions: users,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected user suggestions load failure." }, { status: 500 });
  }
}
