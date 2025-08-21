import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, req) => {
  try {
    const url = new URL(req.url);

    // Keep the health probe public
    if (url.pathname.startsWith("/api/consolidated") && url.searchParams.get("action") === "health") {
      return; // continue
    }

    // Protect all other /api routes with JSON 401 (no redirects)
    if (url.pathname.startsWith("/api/")) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "unauthenticated" } as const, { status: 401 });
      }
      return; // continue
    }

    // Handle SPA routes - serve the React app for all non-API routes
    if (req.method === "GET") {
      const res = NextResponse.next();
      // Add minimal guard header for debugging
      res.headers.set("x-guard-active", "1");
      return res;
    }

    // For non-GET requests, just continue
    return; 
  } catch (e) {
    console.error("middleware_failed", {
      url: req.url,
      method: req.method,
      accept: req.headers.get("accept"),
      err: e instanceof Error ? { name: e.name, msg: e.message, stack: e.stack } : String(e),
    });
    // Do not brick the request:
    return; // continue (avoid converting to 500 here)
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/api/(.*)"], // 👈 Restore full matcher
}; 