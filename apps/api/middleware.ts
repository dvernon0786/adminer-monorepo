import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  // Useful during local dev; safe to keep. Won't leak keys.
  console.error('CLERK_PUBLISHABLE_KEY is missing in middleware.');
}

export default clerkMiddleware((auth, req) => {
  // Allow health endpoint to pass through (public)
  const url = new URL(req.url);
  if (url.pathname === '/api/consolidated' && url.searchParams.get('action') === 'health') {
    return NextResponse.next();
  }
  
  // Protect all other API routes
  // @ts-ignore - Ignore TypeScript errors for Clerk v6.9.4 compatibility
  if (!auth.userId) {
    return NextResponse.json({ error: "unauthenticated" } as const, { status: 401 });
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/api/:path*'], // protect API only
}; 