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

  // For all non-API routes, serve the SPA (frontend)
  // This ensures /dashboard, /, and other routes work properly
  console.log(`[MIDDLEWARE] SPA route detected - serving frontend for: ${pathname}`);
  
  // Rewrite to index.html to let React Router handle the routing
  const url = req.nextUrl.clone();
  url.pathname = '/index.html';
  
  return NextResponse.rewrite(url);
}

// Run middleware on all routes to ensure proper handling
export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
