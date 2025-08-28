import { NextRequest, NextResponse } from "next/server";

const APEX = "adminer.online";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // --- BYPASS: never redirect API or static assets ---
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.match(/\/.*\.[a-zA-Z0-9]+$/) // files with extensions
  ) {
    return NextResponse.next();
  }

  // --- BYPASS: explicit health check (defensive) ---
  if (
    pathname === "/api/consolidated" &&
    req.nextUrl.searchParams.get("action") === "health"
  ) {
    return NextResponse.next();
  }

  // Canonical host redirect (preview and prod safe)
  const host = req.headers.get("host") ?? "";
  const url = req.nextUrl.clone();

  // Only redirect if we're on the www of our production domain
  if (host === `www.${APEX}`) {
    url.hostname = APEX;
    // preserve path & search
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
}; 