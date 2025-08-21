import { clerkMiddleware, auth } from "@clerk/nextjs/server";
import "./src/env"; // boot-time assert for required envs (server-only)

export default clerkMiddleware((auth) => {
  // Protect all API routes
  return auth.protect();
});

export const config = {
  // Restrict middleware strictly to API routes; SPA remains public.
  matcher: ["/api/:path*"]
}; 