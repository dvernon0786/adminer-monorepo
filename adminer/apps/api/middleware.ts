import { NextResponse } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server';

// === Host normalization ===
const CANONICAL_HOST = "adminer.online";

function needsRedirect(req: Request) {
  const url = new URL(req.url);
  const host = url.host;

  // Ignore Vercel preview deployments and localhost
  const isPreview = host.includes(".vercel.app") || host.startsWith("localhost");
  if (isPreview) return false;

  // Only redirect if not already canonical
  return host !== CANONICAL_HOST;
}

// BYPASSES (no auth, no header mutations)
const isHealth = (req: Request) => {
  const u = new URL(req.url)
  return u.pathname === '/api/consolidated' && u.searchParams.get('action') === 'health'
}

const isWebhook = (req: Request) => new URL(req.url).pathname === '/api/payments/webhook'
const isApi = (req: Request) => new URL(req.url).pathname.startsWith('/api/')
const isOptions = (req: Request) => req.method === 'OPTIONS'

/* ========================= CSP: allow what you use ========================= */
const BASE = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "img-src": ["'self'", "data:", "blob:", "https://img.clerk.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": [
    "'self'",
    "https://clerk.com",
    "https://*.clerk.com",
    "https://api.clerk.com",
    "https://challenges.cloudflare.com",
    "https://clerk.adminer.online",
  ],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "https://clerk.com",
    "https://*.clerk.com",
    "https://api.clerk.com",
    "https://assets.clerk.com",
    "https://img.clerk.com",
    "https://challenges.cloudflare.com",
  ],
  "worker-src": ["'self'", "blob:"],
  "frame-src": [
    "'self'",
    "https://challenges.cloudflare.com",
    "https://*.clerk.com",
    "https://clerk.adminer.online",
  ],
} as const

const serialize = (d: Record<string, readonly string[]>) =>
  Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ')

const BASE_CSP = serialize(BASE)

const DEV_CSP = serialize({
  ...BASE,
  "script-src": [...BASE["script-src"], "'unsafe-eval'", "'wasm-unsafe-eval'"],
})

const PROD_CSP = serialize({
  ...BASE,
  "script-src": [...BASE["script-src"], "'wasm-unsafe-eval'"],
})

// Edge-safe random id
const makeSg = () => {
  if (typeof crypto?.randomUUID === 'function') return 'sg.' + crypto.randomUUID()
  return 'sg.' + Math.random().toString(36).slice(2)
}

export default async function middleware(req: Request) {
  try {
    // 0) Fast exits
    if (isHealth(req) || isWebhook(req) || isOptions(req)) {
      console.log('Middleware: Fast exit for:', req.method, new URL(req.url).pathname)
      return NextResponse.next()
    }

    // 0b) Canonical host redirect
    if (needsRedirect(req)) {
      const url = new URL(req.url);
      url.host = CANONICAL_HOST;
      console.log(`Middleware: Redirecting ${req.url} -> ${url.toString()}`);
      return NextResponse.redirect(url, 301);
    }

    // 1) API auth enforcement
    if (isApi(req)) {
      console.log('Middleware: API route accessed:', new URL(req.url).pathname)
      const authHeader = req.headers.get('authorization');
      const hasSession = req.headers.get('cookie')?.includes('__session');
      
      if (!authHeader && !hasSession) {
        const url = new URL(req.url);
        if (url.pathname === '/api/consolidated' && url.searchParams.get('action') === 'health') {
          return NextResponse.next();
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 2) Build response + headers
    const res = NextResponse.next()
    const pathname = new URL(req.url).pathname
    const isAuth = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')
    const isDev = process.env.NODE_ENV === 'development'

    res.headers.set('Referrer-Policy', 'no-referrer')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    // 3) Set sg cookie
    const url = new URL(req.url)
    const isHttps = url.protocol === 'https:'
    const hasSg = req.headers.get('cookie')?.includes('sg=')

    if (!hasSg) {
      res.cookies.set('sg', makeSg(), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60,
        secure: isHttps,
      })
    }

    console.log('Middleware: Headers (and cookie) set for:', pathname, isDev ? '(dev)' : '(prod)')
    return res
  } catch (error) {
    console.error('Critical middleware error:', error)
    const res = NextResponse.next()
    const isDev = process.env.NODE_ENV === 'development'
    console.log('Middleware: Emergency fallback response')
    return res
  }
}

export const config = {
  matcher: [
    '/((?!_next|static|clerk-runtime|vendor|assets|.*\\.(?:js|css|map|png|jpg|svg|ico|txt)$).*)',
    '/api/:path*',
  ],
} 