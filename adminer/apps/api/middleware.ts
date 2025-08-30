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
  
  console.log(`[MIDDLEWARE] ${req.method} ${pathname}`);
  
  // API routes must pass through without any redirects or interference
  if (pathname.startsWith('/api')) {
    console.log(`[MIDDLEWARE] API route - passing through: ${pathname}`);
    // For protected paths, check authentication
    if (PROTECTED_PATHS.some((re) => re.test(pathname))) {
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log(`[MIDDLEWARE] Unauthorized access to protected path: ${pathname}`);
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      console.log(`[MIDDLEWARE] Authorized access to protected path: ${pathname}`);
    }
    return NextResponse.next();
  }

  // Allow Next.js internals and static files
  if (pathname.startsWith('/_next') || pathname.includes('.') || pathname === '/favicon.ico') {
    console.log(`[MIDDLEWARE] Next.js/Static - passing through: ${pathname}`);
    return NextResponse.next();
  }

  // Vercel handles SPA routing via vercel.json rewrites
  // Let Vercel serve the frontend for all non-API routes
  console.log(`[MIDDLEWARE] Non-API route - letting Vercel handle: ${pathname}`);
  return NextResponse.next();
}

// Only run middleware on API routes to avoid conflicts with Vercel SPA routing
export const config = {
  matcher: [
    // Only match API routes - let Vercel handle frontend routing
    '/api/:path*',
  ],
};
