import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // 1) Quick "ping" endpoint that replies directly from middleware
  if (url.pathname === "/__mw-check") {
    return new NextResponse(
      `mw: ok | path=${url.pathname} | ts=${Date.now()}\n`,
      { status: 200, headers: { "x-mw": "hit" } }
    );
  }

  // 2) For everything else (non-API), pass through but tag response
  const res = NextResponse.next();
  res.headers.set("x-mw", "hit");
  return res;
}

// Match EVERYTHING except /api, /_next, and real files with an extension
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
