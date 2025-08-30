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

  // CRITICAL: Serve SPA for ALL other routes (dashboard, homepage, etc.)
  // This must happen BEFORE Next.js can intercept the route
  console.log(`[MIDDLEWARE] SPA ROUTE DETECTED - rewriting ${pathname} -> /index.html`);
  
  // Use rewrite instead of redirect to preserve the URL
  const url = req.nextUrl.clone();
  url.pathname = '/index.html';
  
  return NextResponse.rewrite(url);
}

// CRITICAL: Run middleware on ALL routes to ensure SPA routing works
export const config = {
  matcher: [
    // Match ALL routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
