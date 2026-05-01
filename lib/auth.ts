import { UserRole, type Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionUserId } from "@/lib/session";

const SESSION_IDENTITY_CACHE_TTL_MS = 15_000;
const MAX_SESSION_IDENTITY_CACHE_ENTRIES = 1000;

type SessionIdentityCacheEntry = {
  data: SessionIdentity;
  expiresAt: number;
};

const sessionIdentityCache = new Map<string, SessionIdentityCacheEntry>();

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

function pruneSessionIdentityCache(now: number) {
  if (sessionIdentityCache.size <= MAX_SESSION_IDENTITY_CACHE_ENTRIES) {
    return;
  }

  for (const [cacheKey, cacheEntry] of sessionIdentityCache.entries()) {
    if (cacheEntry.expiresAt <= now) {
      sessionIdentityCache.delete(cacheKey);
    }
  }

  if (sessionIdentityCache.size <= MAX_SESSION_IDENTITY_CACHE_ENTRIES) {
    return;
  }

  const overflow = sessionIdentityCache.size - MAX_SESSION_IDENTITY_CACHE_ENTRIES;
  let removed = 0;

  for (const cacheKey of sessionIdentityCache.keys()) {
    sessionIdentityCache.delete(cacheKey);
    removed += 1;

    if (removed >= overflow) {
      break;
    }
  }
}

export function invalidateSessionIdentityCache(userId?: string) {
  if (!userId) {
    sessionIdentityCache.clear();
    return;
  }

  sessionIdentityCache.delete(userId);
}

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

  const now = Date.now();
  const cachedIdentity = sessionIdentityCache.get(userId);

  if (cachedIdentity && cachedIdentity.expiresAt > now) {
    return cachedIdentity.data;
  }

  const identity = await prisma.user.findUnique({
    where: { id: userId },
    select: sessionIdentitySelect,
  });

  if (!identity) {
    sessionIdentityCache.delete(userId);
    return null;
  }

  sessionIdentityCache.set(userId, {
    data: identity,
    expiresAt: now + SESSION_IDENTITY_CACHE_TTL_MS,
  });

  pruneSessionIdentityCache(now);

  return identity;
}

export function canManageSiteSettings(role: UserRole) {
  return role === "ADMIN" || role === "ORGANIZER";
}

export function canAccessJudging(role: UserRole) {
  return role === "ADMIN" || role === "ORGANIZER" || role === "JUDGE";
}

export function isAdminRole(role: UserRole) {
  return role === "ADMIN";
}

export async function isTeamPaymentVerified(teamId: string): Promise<boolean> {
  const payment = await prisma.teamPayment.findUnique({
    where: {
      teamId_paymentPurpose: {
        teamId,
        paymentPurpose: "REGISTRATION",
      },
    },
    select: { status: true },
  });
  return payment?.status === "VERIFIED";
}
