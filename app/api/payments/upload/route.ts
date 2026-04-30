import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.teamId) {
      return NextResponse.json({ error: "Not authenticated or not in a team" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("receiptFile");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Receipt file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PNG, JPG, WEBP, or PDF files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large. Max size is 5MB" }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name || "receipt");
    const key = `payments/${user.teamId}/${Date.now()}-${safeName}`;

    const uploaded = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url: uploaded.url,
      pathname: uploaded.pathname,
    });
  } catch (error) {
    console.error("[Payment Upload Error]", error);
    return NextResponse.json({ error: "Failed to upload receipt file" }, { status: 500 });
  }
}
