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

  // Allow Next.js internals
  if (pathname.startsWith('/_next')) {
    console.log(`[MIDDLEWARE] Next.js internal - passing through: ${pathname}`);
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.includes('.') || pathname === '/favicon.ico') {
    console.log(`[MIDDLEWARE] Static file - passing through: ${pathname}`);
    return NextResponse.next();
  }

  // Serve SPA for all other routes (dashboard, homepage, etc.)
  console.log(`[MIDDLEWARE] Rewriting to SPA: ${pathname} -> /index.html`);
  return NextResponse.rewrite(new URL('/index.html', req.url));
}

// Run middleware on all routes to handle SPA routing
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
