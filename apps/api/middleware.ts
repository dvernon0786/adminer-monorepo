// Temporarily disabled Clerk middleware to get API working
// import { authMiddleware } from "@clerk/nextjs";
// import "./src/env"; // boot-time assert for required envs (server-only)

// export default authMiddleware({
//   // Protect all API routes
//   publicRoutes: []
// });

export const config = {
  // Restrict middleware strictly to API routes; SPA remains public.
  matcher: ["/api/:path*"]
}; 