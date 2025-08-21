import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

  // Never touch static, assets, or Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Handle API routes separately (protect but don't redirect)
  if (pathname.startsWith("/api")) {
    // Allow health endpoint to pass through (public)
    if (pathname === "/api/consolidated" && req.nextUrl.searchParams.get("action") === "health") {
      return NextResponse.next();
    }
    
    // Protect all other API routes
    if (!auth.userId) {
      return NextResponse.json({ error: "unauthenticated" } as const, { status: 401 });
    }
    return NextResponse.next();
  }

  // Handle page-level redirects (loop-proof)
  const isSignedIn = Boolean(auth.userId);
  const here = pathname + req.nextUrl.search;

  // Helper function to prevent redirect loops
  const go = (targetPath: string) => {
    if (targetPath === here) {
      return NextResponse.next(); // Prevent redirect to same path
    }
    return NextResponse.redirect(new URL(targetPath, req.url));
  };

  // Signed-in users shouldn't stay on sign-in/sign-up/home if you want dashboard
  if (isSignedIn && (pathname === "/" || pathname === "/signin" || pathname === "/signup")) {
    return go("/dashboard");
  }

  // Signed-out users shouldn't access /dashboard
  if (!isSignedIn && pathname.startsWith("/dashboard")) {
    return go(`/signin?redirect_url=${encodeURIComponent(here)}`);
  }

  return NextResponse.next();
});

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