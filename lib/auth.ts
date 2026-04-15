import { UserRole, type Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionUserId } from "@/lib/session";

const sessionUserSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  year: true,
  branch: true,
  phoneNumber: true,
  teamId: true,
} satisfies Prisma.UserSelect;

const sessionIdentitySelect = {
  id: true,
  role: true,
} satisfies Prisma.UserSelect;

export type SessionUser = Prisma.UserGetPayload<{
  select: typeof sessionUserSelect;
}>;

export type SessionIdentity = Prisma.UserGetPayload<{
  select: typeof sessionIdentitySelect;
}>;

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const userId = readSessionUserId(request);
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: sessionUserSelect,
  });
}

export async function getSessionIdentity(request: NextRequest): Promise<SessionIdentity | null> {
  const userId = readSessionUserId(request);
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: sessionIdentitySelect,
  });
}

export function canManageSiteSettings(role: UserRole) {
  return role === "ADMIN" || role === "ORGANIZER";
}

export function isAdminRole(role: UserRole) {
  return role === "ADMIN";
}
