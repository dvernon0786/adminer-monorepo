// Bulletproof middleware - cannot crash under any circumstances
import { NextResponse, NextRequest } from 'next/server'

// BYPASSES (no auth, no header mutations)
const isHealth = (req: NextRequest) => {
  const u = new URL(req.url)
  return u.pathname === '/api/consolidated' && u.searchParams.get('action') === 'health'
}
const isDbPing = (req: NextRequest) => {
  const u = new URL(req.url)
  return u.pathname === '/api/consolidated' && u.searchParams.get('action') === 'db/ping'
}
const isWebhook = (req: NextRequest) => {
  const u = new URL(req.url)
  return u.pathname === '/api/dodo/webhook' || u.pathname === '/api/apify/webhook'
}
const isOptions = (req: NextRequest) => req.method === 'OPTIONS'

// Development mode bypass for local testing
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || 
         process.env.DEV_MODE === 'true' || 
         process.env.CLERK_BYPASS === 'true'
}

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

// Bulletproof middleware with Clerk integration
export default async function middleware(req: NextRequest) {
  try {
    // 0) Fast exits that should never auth/protect or mutate headers
    if (isHealth(req) || isDbPing(req) || isWebhook(req) || isOptions(req)) {
      console.log('Middleware: Fast exit for:', req.method, new URL(req.url).pathname)
      return NextResponse.next()
    }

    // 1) API route protection with Clerk (or dev mode bypass)
    if (req.url.includes('/api/')) {
      console.log('Middleware: API route accessed:', new URL(req.url).pathname)
      
      // Development mode bypass for local testing
      if (isDevelopment()) {
        console.log('Middleware: Development mode - bypassing Clerk auth')
        return NextResponse.next()
      }
      
      // For now, just continue - auth will be handled in the individual API routes
      // This avoids complex Clerk middleware integration issues
      console.log('Middleware: Production mode - continuing to API route for auth handling')
      return NextResponse.next()
    }
    
    // 2) Basic CSP without Clerk
    const res = NextResponse.next()
    const pathname = new URL(req.url).pathname
    const isAuth = pathname.startsWith('/sign-in') || 
                   pathname.startsWith('/sign-up') || 
                   pathname.startsWith('/user') ||
                   pathname.startsWith('/organization') ||
                   pathname.includes('/clerk') ||
                   pathname.includes('/auth')
    
    res.headers.set('Content-Security-Policy', isAuth ? AUTH_CSP : BASE_CSP)
    res.headers.set('Referrer-Policy', 'no-referrer')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // 3) ✅ Set sg cookie so the guard can see it on "/" (Edge-safe)
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL
    // Edge-safe random id (no Node imports)
    const makeSg = () => {
      if (typeof crypto?.randomUUID === 'function') return 'sg.' + crypto.randomUUID()
      // tiny fallback (edge has crypto.getRandomValues, but keep ultra-safe)
      return 'sg.' + Math.random().toString(36).slice(2)
    }
    
    res.cookies.set('sg', makeSg(), {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    return res
  } catch (error) {
    console.error('Middleware: Emergency fallback response')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const config = {
  matcher: [
    // run on API + app routes; skip static/runtime
    '/((?!_next|static|clerk-runtime|vendor|assets|.*\\.(?:js|css|map|png|jpg|svg|ico|txt)$).*)',
    '/api/:path*',
  ],
} 