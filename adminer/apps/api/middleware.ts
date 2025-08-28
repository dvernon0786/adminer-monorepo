import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

// Run only on /api/* to avoid touching SPA routes
export const config = {
  matcher: ["/api/:path*"],
};

export default function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Public health probe — bypass auth entirely
  if (pathname === "/api/consolidated" && searchParams.get("action") === "health") {
    return NextResponse.next();
  }

  // Everything else under /api/* goes through Clerk
  return clerkMiddleware()(req);
} 