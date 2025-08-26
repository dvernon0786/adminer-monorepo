import { NextResponse } from 'next/server'

// BYPASSES (no auth, no header mutations)
const isHealth = (req: Request) => {
  const u = new URL(req.url)
  return u.pathname === '/api/consolidated' && u.searchParams.get('action') === 'health'
}

const isWebhook = (req: Request) => new URL(req.url).pathname === '/api/dodo/webhook'
const isApi = (req: Request) => new URL(req.url).pathname.startsWith('/api/')
const isOptions = (req: Request) => req.method === 'OPTIONS'

/* ========================= CSP: allow what you use ========================= */
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
    "https://clerk.adminer.online",
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
    "https://clerk.adminer.online",
  ],
} as const

const serialize = (d: Record<string, readonly string[]>) =>
  Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ')

const BASE_CSP = serialize(BASE)
const AUTH_CSP = serialize({
  ...BASE,
  "script-src": [...BASE["script-src"], "'unsafe-eval'", "'wasm-unsafe-eval'"], // only on auth routes
})

// Edge-safe random id (no Node imports)
const makeSg = () => {
  if (typeof crypto?.randomUUID === 'function') return 'sg.' + crypto.randomUUID()
  // tiny fallback (edge has crypto.getRandomValues, but keep ultra-safe)
  return 'sg.' + Math.random().toString(36).slice(2)
}

export default async function middleware(req: Request) {
  try {
    // 0) Fast exits (no auth / no header mutations)
    if (isHealth(req) || isWebhook(req) || isOptions(req)) {
      console.log('Middleware: Fast exit for:', req.method, new URL(req.url).pathname)
      return NextResponse.next()
    }

    // 1) (Temporary) allow API; auth to be re-enabled later
    if (isApi(req)) {
      console.log('Middleware: API route accessed:', new URL(req.url).pathname)
    }

    // 2) Build response + security headers
    const res = NextResponse.next()
    const pathname = new URL(req.url).pathname
    const isAuth = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')

    res.headers.set('Content-Security-Policy', isAuth ? AUTH_CSP : BASE_CSP)
    res.headers.set('Referrer-Policy', 'no-referrer')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    // 3) Set sg cookie (Edge-safe + works on localhost)
    const url = new URL(req.url)
    const isHttps = url.protocol === 'https:'
    const hasSg = req.headers.get('cookie')?.includes('sg=')

    if (!hasSg) {
      res.cookies.set('sg', makeSg(), {
        httpOnly: true,
        sameSite: 'lax', // must be lowercase string in TS
        path: '/',
        maxAge: 60 * 60, // 1 hour
        secure: isHttps, // false on http://localhost, true on prod
      })
    }

    console.log('Middleware: Headers (and cookie) set for:', pathname)
    return res
  } catch (error) {
    console.error('Critical middleware error:', error)
    // 4) Last resort: safe response with minimal headers
    const res = NextResponse.next()
    res.headers.set('Content-Security-Policy', BASE_CSP)
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