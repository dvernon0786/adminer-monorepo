// apps/api/src/middleware.ts
import { NextResponse } from 'next/server'

// BYPASSES (no auth, no header mutations)
const isHealth = (req: Request) => {
  const u = new URL(req.url)
  return u.pathname === '/api/consolidated' && u.searchParams.get('action') === 'health'
}
const isWebhook = (req: Request) => new URL(req.url).pathname === '/api/dodo/webhook'
const isApi = (req: Request) => new URL(req.url).pathname.startsWith('/api/')
const isOptions = (req: Request) => req.method === 'OPTIONS'

/* =========================
   CSP: allow what you use
   ========================= */
const BASE = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],

  // images (Clerk avatars), data URIs, and blob (runtime blobs)
  "img-src": ["'self'", "data:", "blob:", "https://img.clerk.com"],

  // styles & fonts
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],

  // XHR/fetch to Clerk & Turnstile; include your custom Clerk domain
  "connect-src": [
    "'self'",
    "https://clerk.com",
    "https://*.clerk.com",
    "https://api.clerk.com",
    "https://challenges.cloudflare.com",
    "https://clerk.adminer.online", // ← custom Clerk domain
  ],

  // scripts; we widen ONLY on auth routes below
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

  // ClerkJS creates blob workers
  "worker-src": ["'self'", "blob:"],

  // iframes for Turnstile + (optionally) Clerk
  "frame-src": [
    "'self'",
    "https://challenges.cloudflare.com",
    "https://*.clerk.com",
    "https://clerk.adminer.online", // ← custom Clerk domain
  ],
} as const

const serialize = (d: Record<string, readonly string[]>) =>
  Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ')

const BASE_CSP = serialize(BASE)
const AUTH_CSP = serialize({
  ...BASE,
  "script-src": [...BASE["script-src"], "'unsafe-eval'", "'wasm-unsafe-eval'"], // only on auth routes
})

// Bulletproof middleware without Clerk integration
export default async function middleware(req: Request) {
  try {
    // 0) Fast exits that should never auth/protect or mutate headers
    if (isHealth(req) || isWebhook(req) || isOptions(req)) {
      console.log('Middleware: Fast exit for:', req.method, new URL(req.url).pathname)
      return NextResponse.next()
    }

    // 1) Basic protection for API routes (temporary - allow all to prevent crashes)
    if (isApi(req)) {
      console.log('Middleware: API route accessed:', new URL(req.url).pathname)
      // TODO: Re-implement auth protection once Clerk is stable
      // For now, allow all API calls to prevent crashes
    }
    
    // 2) Basic CSP without Clerk
    const res = NextResponse.next()
    const pathname = new URL(req.url).pathname
    const isAuth = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')
    
    res.headers.set('Content-Security-Policy', isAuth ? AUTH_CSP : BASE_CSP)
    res.headers.set('Referrer-Policy', 'no-referrer')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    console.log('Middleware: Headers set successfully for:', pathname)
    return res
    
  } catch (error) {
    console.error('Critical middleware error:', error)
    
    // 3) Last resort: Return safe response with minimal headers
    const res = NextResponse.next()
    res.headers.set('Content-Security-Policy', BASE_CSP)
    console.log('Middleware: Emergency fallback response')
    return res
  }
}

// Match API and SPA routes; exclude static/runtime correctly
export const config = {
  matcher: [
    // run on API + app routes; skip static/runtime
    '/((?!_next|static|clerk-runtime|vendor|assets|.*\\.(?:js|css|map|png|jpg|svg|ico|txt)$).*)',
    '/api/:path*',
  ],
} 