import { prisma } from "@/lib/prisma";

export const GLOBAL_SETTINGS_KEY = "global";

const SETTINGS_CACHE_TTL_MS = 60_000;

type SiteSettingsSnapshot = {
  registrationOpen: boolean;
  repositorySubmissionOpen: boolean;
};

let settingsCache: {
  expiresAt: number;
  data: SiteSettingsSnapshot;
} | null = null;

function toSnapshot(settings: {
  registrationOpen: boolean;
  repositorySubmissionOpen: boolean;
}): SiteSettingsSnapshot {
  return {
    registrationOpen: settings.registrationOpen,
    repositorySubmissionOpen: settings.repositorySubmissionOpen,
  };
}

export function invalidateSiteSettingsCache() {
  settingsCache = null;
}

export async function getOrCreateSiteSettings() {
  const now = Date.now();
  if (settingsCache && now < settingsCache.expiresAt) {
    return settingsCache.data;
  }

  const existing = await prisma.siteSettings.findUnique({
    where: { singletonKey: GLOBAL_SETTINGS_KEY },
    select: {
      registrationOpen: true,
      repositorySubmissionOpen: true,
    },
  });

  const settings =
    existing ??
    (await prisma.siteSettings.create({
      data: { singletonKey: GLOBAL_SETTINGS_KEY },
      select: {
        registrationOpen: true,
        repositorySubmissionOpen: true,
      },
    }));

  const snapshot = toSnapshot(settings);
  settingsCache = {
    data: snapshot,
    expiresAt: now + SETTINGS_CACHE_TTL_MS,
  };

  return snapshot;
}

export async function updateSiteSettingsRegistrationOpen(registrationOpen: boolean) {
  const updatedSettings = await prisma.siteSettings.upsert({
    where: { singletonKey: GLOBAL_SETTINGS_KEY },
    update: { registrationOpen },
    create: {
      singletonKey: GLOBAL_SETTINGS_KEY,
      registrationOpen,
    },
    select: {
      registrationOpen: true,
      repositorySubmissionOpen: true,
    },
  });

  const snapshot = toSnapshot(updatedSettings);
  settingsCache = {
    data: snapshot,
    expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
  };

  return snapshot;
}

export async function updateSiteSettingsRepositorySubmissionOpen(repositorySubmissionOpen: boolean) {
  const updatedSettings = await prisma.siteSettings.upsert({
    where: { singletonKey: GLOBAL_SETTINGS_KEY },
    update: { repositorySubmissionOpen },
    create: {
      singletonKey: GLOBAL_SETTINGS_KEY,
      repositorySubmissionOpen,
    },
    select: {
      registrationOpen: true,
      repositorySubmissionOpen: true,
    },
  });

  const snapshot = toSnapshot(updatedSettings);
  settingsCache = {
    data: snapshot,
    expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
  };

  return snapshot;
}
