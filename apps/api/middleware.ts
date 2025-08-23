import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isApiRoute = createRouteMatcher(['/api/(.*)']);
// (Optional) protect SPA areas too, e.g. dashboards
// const isDashboard = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isApiRoute(req)) {
    await auth.protect(); // 401 when signed out
  }
  // if (isDashboard(req)) await auth.protect();
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