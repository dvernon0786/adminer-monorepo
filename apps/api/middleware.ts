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

// API routes (enforce JSON 401 when unauthenticated)
const isApiRoute = createRouteMatcher(["/api/(.*)"]);

// Helper: is this a browser navigation (HTML doc request)?
function isHtmlNav(req: Request) {
  // Only GET requests with text/html in Accept are treated as navigations
  if ((req as any).method !== "GET") return false;
  const accept = req.headers.get("accept") || "";
  return accept.includes("text/html");
}

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);

  // Default is "continue" the chain
  let res: NextResponse | undefined;

  // --- API handling (no cookie stamping here) ---
  if (isApiRoute(req)) {
    // Health probe remains public
    if (url.pathname.startsWith("/api/consolidated") && url.searchParams.get("action") === "health") {
      return; // continue
    }
    // Enforce auth; return JSON 401 (no redirects) if signed out
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthenticated" } as const, { status: 401 });
    }
    return; // continue
  }

  // --- Non-API routes ---
  // Let public routes pass; we only stamp the cookie for real HTML navigations
  if (isPublicRoute(req)) {
    if (isHtmlNav(req)) {
      res = NextResponse.next();
      // Stamp the "server-guard" cookie only on browser navigations
      res.cookies.set("sg", "1", {
        path: "/",
        sameSite: "lax",
        httpOnly: false, // readable by SPA
        secure: true,
        maxAge: 60 * 60,
      });
      return res;
    }
    return; // continue (no cookie on non-HTML requests)
  }

  // For non-public, non-API routes (rare in this layout), stay passive
  if (isHtmlNav(req)) {
    res = NextResponse.next();
    res.cookies.set("sg", "1", {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: true,
      maxAge: 60 * 60,
    });
    return res;
  }

  return; // continue
});

export const config = {
  // Run middleware for human-routable paths + all API endpoints; exclude assets/_next
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/api/(.*)"],
}; 