import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isApi = createRouteMatcher(['/api/(.*)', '/trpc/(.*)']);
const isDashboard = createRouteMatcher(['/dashboard(.*)']);

// CSP configuration - same as next.config.mjs to ensure consistency
const CF_TURNSTILE = 'https://challenges.cloudflare.com';
const GF_CSS = 'https://fonts.googleapis.com';
const GF_FILES = 'https://fonts.gstatic.com';
const CLERK_CUSTOM = 'https://clerk.adminer.online';
const CLERK_HOSTS = [
  'https://clerk.com',
  'https://*.clerk.com',
  'https://api.clerk.com',
  'https://assets.clerk.com',
  'https://img.clerk.com'
];
const DODO_API = 'https://api.dodopayments.com';

const isPreview = process.env.VERCEL_ENV === 'preview';
const allowEval = isPreview || process.env.NODE_ENV === 'development';

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  [
    'script-src',
    "'self'",
    "'unsafe-inline'",
    allowEval ? "'unsafe-eval'" : '',
    CLERK_CUSTOM,
    CF_TURNSTILE,
    ...CLERK_HOSTS,
  ].filter(Boolean).join(' '),
  [
    'script-src-elem',
    "'self'",
    "'unsafe-inline'",
    CLERK_CUSTOM,
    CF_TURNSTILE,
    ...CLERK_HOSTS,
  ].join(' '),
  `style-src 'self' 'unsafe-inline' ${GF_CSS}`,
  `style-src-elem 'self' 'unsafe-inline' ${GF_CSS}`,
  `font-src 'self' ${GF_FILES} data:`,
  `frame-src 'self' ${CF_TURNSTILE}`,
  `img-src 'self' data: blob: ${CF_TURNSTILE} https://img.clerk.com`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  [
    'connect-src',
    "'self'",
    CLERK_CUSTOM,
    ...CLERK_HOSTS,
    CF_TURNSTILE,
    GF_CSS,
    GF_FILES,
    DODO_API,
    !process.env.VERCEL_ENV ? 'http://localhost:* ws://localhost:*' : '',
    !process.env.VERCEL_ENV ? 'http://127.0.0.1:* ws://127.0.0.1:*' : '',
  ].filter(Boolean).join(' '),
].join('; ');

export default clerkMiddleware(
  async (auth, req) => {
    try {
      const url = new URL(req.url);
      const { pathname, searchParams } = url;

      // Bypass health so curl doesn't hit MIDDLEWARE_INVOCATION_FAILED
      if (pathname === '/api/consolidated' && searchParams.get('action') === 'health') {
        return NextResponse.next();
      }

      if (isApi(req) || isDashboard(req)) {
        await auth.protect(); // 401 when signed out
      }

      // Force CSP for HTML responses to ensure Turnstile is always allowed
      const accept = req.headers.get('accept') || '';
      if (accept.includes('text/html')) {
        const res = NextResponse.next();
        res.headers.set('Content-Security-Policy', csp);
        res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.headers.set('X-Content-Type-Options', 'nosniff');
        res.headers.set('X-Frame-Options', 'SAMEORIGIN');
        res.headers.set('X-XSS-Protection', '0');
        res.headers.set('Cache-Control', 'no-store, must-revalidate');
        return res;
      }
    } catch (err) {
      console.error('middleware error', err);
      // Never throw from middleware on Vercel
      return new NextResponse('middleware_error', { status: 200 });
    }
  },
  { debug: true }
);

export const config = {
  matcher: [
    '/api/(.*)',
    '/trpc/(.*)',
    '/dashboard/(.*)',
    // Add HTML routes to ensure CSP is set
    '/((?!_next/|assets/|vendor/|clerk-runtime/|.*\\.(?:js|css|png|jpg|svg|ico)$).*)',
  ],
}; 