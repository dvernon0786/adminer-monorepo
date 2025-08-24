import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Match auth routes including ALL nested steps
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

// Exact health check bypass (no headers touched)
function isHealth(req: Request) {
  const url = new URL(req.url);
  return url.pathname === '/api/consolidated' && url.searchParams.get('action') === 'health';
}

// Webhook bypass (no auth)
function isWebhook(req: Request) {
  const url = new URL(req.url);
  return url.pathname === '/api/dodo/webhook';
}

const BASE_CSP = [
  "default-src 'self'",
  "img-src 'self' data: https://img.clerk.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.clerk.com https://clerk.com https://*.clerk.com https://challenges.cloudflare.com",
  "script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.com https://api.clerk.com https://assets.clerk.com https://img.clerk.com https://challenges.cloudflare.com",
].join('; ');

const AUTH_CSP = [BASE_CSP, "'unsafe-eval' 'wasm-unsafe-eval'"].join('; ');

export default clerkMiddleware((auth, req) => {
  // 1) Early exits
  if (isHealth(req)) return NextResponse.next();

  // Protect API except webhook + health
  const { pathname } = new URL(req.url);
  if (pathname.startsWith('/api/') && !isWebhook(req) && !isHealth(req)) {
    auth().protect();
  }

  // 2) Attach correct CSP
  const res = NextResponse.next();
  res.headers.set('Content-Security-Policy', isAuthRoute(req) ? AUTH_CSP : BASE_CSP);

  // Optional hardening
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
});

export const config = {
  matcher: [
    '/api/:path*',
    // Run on all SPA routes, but skip static files/runtime
    '/((?!_next|static|clerk-runtime|vendor|assets|.*\\.(?:js|css|map|png|jpg|svg|ico|txt)$).*)',
  ],
}; 