import { authMiddleware } from "@clerk/nextjs";
import "./src/env"; // boot-time assert for required envs (server-only)

export default authMiddleware({
  // We don't declare publicRoutes here because the matcher ensures only /api/* is protected.
  // Any matched route requires a valid session; otherwise Clerk returns 401 automatically.
});

export const config = {
  // Restrict middleware strictly to API routes; SPA remains public.
  matcher: ["/api/:path*"]
}; 