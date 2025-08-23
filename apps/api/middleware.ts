import { authMiddleware } from "@clerk/nextjs";

// Keep your auth config as-is, but ensure matcher excludes static stuff.
export default authMiddleware({
  // your publicRoutes / ignoredRoutes if needed
});

export const config = {
  matcher: [
    // Exclude _next, assets, public files, and env.js from middleware
    '/((?!_next|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml|env\\.js|public).*)',
    // Include API only if you really want it guarded
    // '/api/(.*)',
  ],
}; 