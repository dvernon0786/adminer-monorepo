import { clerkMiddleware } from "@clerk/nextjs/server";
import "./src/env"; // boot-time assert for required envs (server-only)

export default clerkMiddleware((auth) => {
  // Protect all API routes
  const protectedAuth = auth.protect();
  if (!protectedAuth) {
    // Return unauthorized response
    return new Response('Unauthorized', { status: 401 });
  }
  // Continue to the next middleware or handler
  return;
});

export const config = {
  // Restrict middleware strictly to API routes; SPA remains public.
  matcher: ["/api/:path*"]
}; 