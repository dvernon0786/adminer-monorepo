import { NextResponse } from "next/server";

// Ultra-minimal middleware - no Clerk, no complex logic
export default function middleware(req: Request) {
  try {
    const url = new URL(req.url);
    
    // Only handle API routes for now
    if (url.pathname.startsWith("/api/")) {
      // For now, just continue without auth (we'll add it back once basic works)
      return NextResponse.next();
    }
    
    // For all other routes, just continue
    return NextResponse.next();
  } catch (e) {
    console.error("middleware_failed", {
      url: req.url,
      method: req.method,
      err: e instanceof Error ? { name: e.name, msg: e.message, stack: e.stack } : String(e),
    });
    // Always continue, never fail
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/api/(.*)"],
}; 