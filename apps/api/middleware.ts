import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Fail fast if required envs are missing (Edge-safe: only reads process.env)
const required = ["CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"] as const;
for (const key of required) {
  const v = process.env[key];
  if (!v || String(v).trim() === "") {
    throw new Error(
      `Missing required env var: ${key}. Set it in Vercel (Preview & Production) or run "vercel pull" locally.`
    );
  }
}

// Protect only /api/*; return stable 401 JSON when unauthenticated
export default clerkMiddleware((auth) => {
  // @ts-ignore - Ignore TypeScript errors for Clerk v6.9.4 compatibility
  if (!auth.userId) {
    return NextResponse.json({ error: "unauthenticated" } as const, { status: 401 });
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/api/:path*"]
}; 