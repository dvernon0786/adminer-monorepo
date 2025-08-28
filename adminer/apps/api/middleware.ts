import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Safe, single-purpose middleware:
 * - If host is www.adminer.online → 308 to apex (adminer.online)
 * - Never touches /api, /_next, or any file paths (.*\..*)
 * - Returns NextResponse.next() for all other cases
 */

export const config = {
  // Run on everything, but we'll filter inside to be 100% safe.
  matcher: ["/:path*"],
};

export default function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const host = req.headers.get("host") || url.host;
  const pathname = url.pathname;

  // Hard exclusions: do not ever touch API, Next assets, or files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    /\.[A-Za-z0-9]+$/.test(pathname) || // any file like .js, .css, .png, etc.
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Canonicalize: WWW → apex (permanent 308, satisfies smoke test)
  if (host === "www.adminer.online") {
    const target = `https://adminer.online${pathname}${url.search}`;
    return NextResponse.redirect(target, 308);
  }

  // Everything else: do nothing
  return NextResponse.next();
} 