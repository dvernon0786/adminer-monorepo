import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isHtmlNav = (req: NextRequest) => {
  const accept = req.headers.get("accept") || "";
  // Treat as an HTML navigation when text/html appears (typical browser navs)
  return accept.includes("text/html");
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0) Ping: prove execution without relying on headers
  if (pathname === "/__mw-check") {
    return new NextResponse(`mw: ok | path=${pathname} | ts=${Date.now()}\n`, {
      status: 200,
      headers: { "x-mw": "hit" },
    });
  }

  // 1) Asset Allowlist - CRITICAL: Never rewrite these to SPA
  const ASSET_ALLOWLIST = [
    /^\/assets\//,           // Vite built assets
    /^\/favicon\.ico$/,      // Favicon
    /^\/robots\.txt$/,       // Robots
    /^\/manifest\.webmanifest$/, // PWA manifest
    /^\/clerk-runtime\//,    // Clerk runtime files
    /^\/vendor\//            // Vendor files
  ];
  
  if (ASSET_ALLOWLIST.some(rx => rx.test(pathname))) {
    return NextResponse.next();
  }

  // 2) Other exclusions: API, Next internals, files with extensions
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)   // any file extension like .css/.js/.png
  ) {
    return NextResponse.next();
  }

  // 2) HTML navigations → SPA index.html (internal rewrite; no 308 cleanUrls)
  if (isHtmlNav(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/index.html"; // lives in apps/api/public/index.html
    const res = NextResponse.rewrite(url);
    res.headers.set("x-mw", "spa-rewrite");
    return res;
  }

  // 3) Non-HTML (e.g., XHR/JSON) → pass through (lets API handle 404/JSON)
  const res = NextResponse.next();
  res.headers.set("x-mw", "hit");
  return res;
}

// Match everything; we do exclusions in code for clarity
export const config = {
  matcher: ["/:path*"],
};
