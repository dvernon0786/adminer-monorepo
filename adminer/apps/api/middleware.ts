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

  // 2) Skip API and Next.js internal routes
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 3) Skip static files with extensions
  if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return NextResponse.next();
  }

  // 4) SPA Fallback: Rewrite everything else to index.html
  console.log(`[MIDDLEWARE] SPA fallback: ${url.pathname} → /index.html`);
  const rewriteUrl = req.nextUrl.clone();
  rewriteUrl.pathname = "/index.html";
  
  const response = NextResponse.rewrite(rewriteUrl);
  response.headers.set("x-mw", "hit");
  return response;
}

// Match EVERYTHING except /api, /_next, and real files with an extension
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
