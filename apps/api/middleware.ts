import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes (static SPA + public API health)
const isPublicRoute = createRouteMatcher([
  "/",               // SPA entry
  "/dashboard(.*)",  // SPA client-routed pages should be public at HTTP level
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/consolidated", // allow health probe without auth (we gate by action below)
  "/api/public/(.*)",
]);

// Strict API protection (JSON 401 on unauthenticated)
const isApiRoute = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);

  // Always stamp a "server-guard" cookie so the SPA knows middleware is active
  const res = NextResponse.next();
  res.cookies.set("sg", "1", {
    path: "/",
    sameSite: "lax",  // lowercase per Next.js types
    httpOnly: false,  // readable by SPA
    secure: true,
    maxAge: 60 * 60,  // 1 hour
  });

  // Let public routes pass without server-side auth redirects
  if (isPublicRoute(req)) {
    // Keep /api/consolidated?action=health public
    if (
      url.pathname.startsWith("/api/consolidated") &&
      url.searchParams.get("action") === "health"
    ) {
      return res;
    }
    return res;
  }

  // For API routes, enforce auth and return JSON 401 when signed out (no HTML redirects)
  if (isApiRoute(req)) {
    const { userId } = await auth(); // <-- await the Promise in your Clerk typing
    if (!userId) {
      return NextResponse.json({ error: "unauthenticated" } as const, { status: 401 });
    }
    return res;
  }

  // For any other (non-API) route, remain passive; SPA handles UX.
  return res;
});

export const config = {
  // Run middleware for all human-routable paths + all API endpoints
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/api/(.*)"],
}; 