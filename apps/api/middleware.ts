import { NextRequest, NextResponse } from "next/server";

const PROD_APEX = "adminer.online";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;

  // Skip previews
  if (host.endsWith(".vercel.app")) return NextResponse.next();

  // Never touch API, Next assets, or files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Canonicalize public pages only
  if (host === `www.${PROD_APEX}`) {
    const url = req.nextUrl.clone();
    url.hostname = PROD_APEX;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

// Simple, supported matcher: run on all paths
export const config = { matcher: ["/:path*"] }; 