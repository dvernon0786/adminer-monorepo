import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const PUBLIC_PATHS = new Set(["/", "/signin", "/signup"]);
const IGNORE_PREFIXES = ["/_next", "/assets", "/favicon", "/api", "/public"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Never touch static, assets, or Next internals
  if (IGNORE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Handle API routes separately (protect but don't redirect)
  if (pathname.startsWith("/api")) {
    // Allow health endpoint to pass through (public)
    if (pathname === "/api/consolidated" && req.nextUrl.searchParams.get("action") === "health") {
      return NextResponse.next();
    }
    
    // Protect all other API routes
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return NextResponse.json({ error: "unauthenticated" } as const, { status: 401 });
      }
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: "authentication error" } as const, { status: 401 });
    }
  }

  // Handle page-level redirects (loop-proof)
  try {
    const { userId } = getAuth(req);
    const isSignedIn = Boolean(userId);
    const here = pathname + search;

    // Helper function to prevent redirect loops
    const go = (targetPath: string) => {
      if (targetPath === here) {
        return NextResponse.next(); // Prevent redirect to same path
      }
      return NextResponse.redirect(new URL(targetPath, req.url));
    };

    // Signed-in users shouldn't stay on sign-in/sign-up/home if you want dashboard
    if (isSignedIn && PUBLIC_PATHS.has(pathname)) {
      return go("/dashboard");
    }

    // Signed-out users shouldn't access /dashboard
    if (!isSignedIn && pathname.startsWith("/dashboard")) {
      return go(`/signin?redirect_url=${encodeURIComponent(here)}`);
    }

    return NextResponse.next();
  } catch (error) {
    // If auth check fails, allow the request to proceed (fallback to client-side auth)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}; 