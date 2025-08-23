import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isApiRoute = createRouteMatcher(['/api/(.*)']);
// (Optional) protect SPA areas too, e.g. dashboards
// const isDashboard = createRouteMatcher(['/dashboard(.*)']);

// Enhanced Clerk middleware with comprehensive error handling
export default clerkMiddleware(async (auth, req) => {
  try {
    if (isApiRoute(req)) {
      await auth.protect(); // 401 when signed out
    }
    // if (isDashboard(req)) await auth.protect();
  } catch (error) {
    // Log middleware errors for debugging but don't crash
    console.error('Clerk middleware error:', error);
    
    // For API routes, return a proper error response
    if (isApiRoute(req)) {
      return new Response(
        JSON.stringify({ 
          error: 'Authentication service temporarily unavailable',
          message: 'Please try again in a moment',
          code: 'AUTH_SERVICE_UNAVAILABLE'
        }), 
        { 
          status: 503, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }
});

// IMPORTANT: exclude static files so CSS/JS don't get intercepted
export const config = {
  matcher: [
    // Skip Next internals + any file with an extension; always run on API.
    // This is Clerk's documented default, copied verbatim.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}; 