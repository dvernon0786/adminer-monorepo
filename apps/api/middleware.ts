import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Keep your auth config as-is, but ensure matcher excludes static stuff.
export default clerkMiddleware((auth, request) => {
  // Let Clerk handle authentication for non-static routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Exclude _next, assets, public files, and env.js from middleware
    '/((?!_next|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml|env\\.js|public).*)',
    // Include API only if you really want it guarded
    // '/api/(.*)',
  ],
}; 