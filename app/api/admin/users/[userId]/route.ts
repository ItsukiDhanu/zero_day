import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { getSessionIdentity, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const sessionUser = await getSessionIdentity(request);

    if (!sessionUser) {
      throw new ApiError(401, "No active session.");
    }

    if (!isAdminRole(sessionUser.role)) {
      throw new ApiError(403, "Only admins can delete users.");
    }

    const { userId } = await context.params;

    if (sessionUser.id === userId) {
      throw new ApiError(409, "Admins cannot delete their own account.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!existingUser) {
      throw new ApiError(404, "User not found.");
    }

    await prisma.user.delete({
      where: { id: existingUser.id },
    });

    return NextResponse.json({
      message: `Deleted user ${existingUser.email}.`,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected user deletion failure." }, { status: 500 });
  }
}
