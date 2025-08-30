import { NextRequest, NextResponse } from "next/server";

// Only protect API routes - let Vercel handle SPA routing
const PROTECTED_PATHS = [
  /^\/api\/admin\//,         // Admin API endpoints only
  /^\/api\/billing\//,       // Billing API endpoints only
  /^\/api\/jobs\//,          // Jobs API endpoints only
  /^\/api\/webhooks\//,      // Webhook endpoints only
];

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Only apply middleware to protected API paths
  if (!PROTECTED_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // For protected paths, check authentication
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

// Only run middleware on specific API paths, not everything
export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/billing/:path*", 
    "/api/jobs/:path*",
    "/api/webhooks/:path*"
  ],
};
