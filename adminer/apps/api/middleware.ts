import { NextRequest, NextResponse } from "next/server";

// File/route allowlist that should NEVER be rewritten
function isAllowedPath(pathname: string): boolean {
  if (pathname === "/") return false; // we want SPA at /
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/assets/")) return true;              // Vite build output
  if (pathname.startsWith("/public/")) return true;              // static dir (defensive)
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/favicon-")) return true;             // hashed favicons
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  if (pathname === "/manifest.webmanifest" || pathname.endsWith(".webmanifest")) return true;
  if (pathname === "/service-worker.js") return true;

  // Any direct file request like /something.ext (png, jpg, css, js, map, etc.)
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { method, nextUrl, headers } = req;
  const { pathname } = nextUrl;

  // Only consider GET navigations
  if (method !== "GET") return NextResponse.next();

  // If the request is clearly for a non-HTML resource, bail
  const accept = headers.get("accept") || "";
  const wantsHTML = accept.includes("text/html");
  if (!wantsHTML) return NextResponse.next();

  // Pass-through for assets and infrastructure files
  if (isAllowedPath(pathname)) return NextResponse.next();

  // Rewrite all other HTML navigations to the SPA entry
  const url = new URL("/index.html", req.url);
  const res = NextResponse.rewrite(url);
  // Marker for smoke tests; also avoid caching during stabilization
  res.headers.set("x-mw", "spa-direct");
  res.headers.set("cache-control", "no-store, max-age=0");
  return res;
}

// Extra safety: limit where middleware runs to reduce overhead.
export const config = {
  matcher: [
    // Everything except explicit excludes; runtime guard above will re-check.
    "/((?!api|_next|assets|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|service-worker.js).*)",
  ],
};
