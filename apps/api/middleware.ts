import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(() => NextResponse.next());

// Keep SPA assets public, lock API except webhook
export const config = {
  matcher: [
    "/api/:path*",
    // exclude webhook from auth (it uses HMAC):
    // { source: "/api/dodo/webhook", missing: [] } // if you need an explicit allowlist, otherwise just let it pass and ignore auth inside handler
  ],
}; 