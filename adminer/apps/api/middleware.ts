import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Hard exclusions: API, Next internals, and any file-like request
const EXCLUDED = [/^\/api\//, /^\/_next\//, /\/.*\.[^\/]+$/];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Skip middleware for excluded paths
  if (EXCLUDED.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // Only canonicalize host: www.adminer.online → adminer.online
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const url = new URL(req.url);
    url.host = host.slice(4); // strip "www."
    // IMPORTANT: never put host into the pathname; only change url.host
    return NextResponse.redirect(url, 308);
  }

  // Pass everything else through untouched
  return NextResponse.next();
}

// Apply to "all" paths, but NOT api, _next, or file-like paths
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}; 