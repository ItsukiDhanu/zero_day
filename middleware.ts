import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function hasTrustedOrigin(request: NextRequest) {
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    // Allow non-browser and same-origin requests that do not send Origin.
    return true;
  }

  let origin: URL;

  try {
    origin = new URL(originHeader);
  } catch {
    return false;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return false;
  }

  const protocol = request.headers.get("x-forwarded-proto")
    ? `${request.headers.get("x-forwarded-proto")}:`
    : request.nextUrl.protocol;

  return origin.host === host && origin.protocol === protocol;
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (SAFE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
