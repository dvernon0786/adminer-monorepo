import { NextRequest, NextResponse } from "next/server";

const APEX = "adminer.online";
const WWW  = "www.adminer.online";

/**
 * Only do hostname normalization.
 * Do NOT handle SPA rewrites here (vercel.json will).
 * Always no-op on *.vercel.app and on local/preview environments.
 */
export function middleware(req: NextRequest) {
  const { nextUrl } = req;

  // Skip for API/static/_next and known assets
  const path = nextUrl.pathname;
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.startsWith("/assets/") ||
    path === "/favicon.ico" ||
    path === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Bypass preview deployments / local dev
  const hostname = nextUrl.hostname; // <-- important: no ports (fixes :443 loops)
  if (hostname.endsWith(".vercel.app") || hostname === "localhost") {
    return NextResponse.next();
  }

  // Redirect WWW -> APEX (and only that)
  if (hostname === WWW) {
    nextUrl.hostname = APEX;
    return NextResponse.redirect(nextUrl, 301);
  }

  // If already APEX or something else, do nothing here.
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
}; 