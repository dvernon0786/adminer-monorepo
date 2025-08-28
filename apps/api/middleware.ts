import { NextRequest, NextResponse } from "next/server";

const PROD_APEX = "adminer.online";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";

  // Never canonicalize previews
  if (host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  // Only canonicalize the production host from www -> apex
  if (host === `www.${PROD_APEX}`) {
    const url = req.nextUrl.clone();
    url.hostname = PROD_APEX; // preserve path & query
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

// Exclude API, _next and files entirely so health never sees middleware
export const config = {
  matcher: [
    // anything that is NOT api, NOT _next, and NOT a file with extension
    "/((?!api|_next|.*\\..*).*)"
  ]
}; 