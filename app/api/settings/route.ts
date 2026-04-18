import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-error";
import { canManageSiteSettings, getSessionIdentity } from "@/lib/auth";
import {
  getOrCreateSiteSettings,
  updateSiteSettingsRegistrationOpen,
  updateSiteSettingsRepositorySubmissionOpen,
} from "@/lib/site-settings";

type SettingsPatchPayload = {
  registrationOpen?: unknown;
  repositorySubmissionOpen?: unknown;
};

export async function GET() {
  const settings = await getOrCreateSiteSettings();

  return NextResponse.json(
    {
      registrationOpen: settings.registrationOpen,
      repositorySubmissionOpen: settings.repositorySubmissionOpen,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
      },
    },
  );
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionIdentity(request);
    if (!user) {
      throw new ApiError(401, "No active session.");
    }

    if (!canManageSiteSettings(user.role)) {
      throw new ApiError(403, "Only organizers and admins can update site settings.");
    }

    const payload = (await request.json()) as SettingsPatchPayload;

    const hasRegistrationOpen = typeof payload.registrationOpen === "boolean";
    const hasRepositorySubmissionOpen = typeof payload.repositorySubmissionOpen === "boolean";

    if (!hasRegistrationOpen && !hasRepositorySubmissionOpen) {
      throw new ApiError(
        400,
        "Provide at least one boolean field: registrationOpen or repositorySubmissionOpen.",
      );
    }

    let updatedSettings = await getOrCreateSiteSettings();

    if (hasRegistrationOpen) {
      updatedSettings = await updateSiteSettingsRegistrationOpen(payload.registrationOpen as boolean);
    }

    if (hasRepositorySubmissionOpen) {
      updatedSettings = await updateSiteSettingsRepositorySubmissionOpen(
        payload.repositorySubmissionOpen as boolean,
      );
    }

    return NextResponse.json({
      registrationOpen: updatedSettings.registrationOpen,
      repositorySubmissionOpen: updatedSettings.repositorySubmissionOpen,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unexpected settings update failure." }, { status: 500 });
  }
}
