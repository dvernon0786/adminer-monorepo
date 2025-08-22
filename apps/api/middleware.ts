import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Custom middleware for static asset handling
function staticAssetMiddleware(request: any) {
  const { pathname } = request.nextUrl

  // Explicitly handle static assets with correct MIME types
  if (pathname.startsWith('/assets/')) {
    // Force Next.js to serve these as static files
    const response = NextResponse.next()
    
    // Set appropriate headers for static assets
    if (pathname.endsWith('.js')) {
      response.headers.set('Content-Type', 'application/javascript')
    } else if (pathname.endsWith('.css')) {
      response.headers.set('Content-Type', 'text/css')
    } else if (pathname.endsWith('.html')) {
      response.headers.set('Content-Type', 'text/html')
    }
    
    return response
  }

  // Handle env.js specifically
  if (pathname === '/env.js') {
    const response = NextResponse.next()
    response.headers.set('Content-Type', 'application/javascript')
    return response
  }

  return NextResponse.next()
}

// Combine Clerk middleware with static asset handling
export default clerkMiddleware((auth, request) => {
  // First handle static assets
  const staticResponse = staticAssetMiddleware(request)
  if (staticResponse) return staticResponse
  
  // Then let Clerk handle authentication for other routes
  return NextResponse.next()
});

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
} 