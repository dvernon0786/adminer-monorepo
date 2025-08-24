// apps/api/src/middleware.ts
import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Match all nested auth steps
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Quick helpers
const isHealth = (req: Request) =>
  new URL(req.url).pathname === '/api/consolidated' && new URL(req.url).searchParams.get('action') === 'health'

const isWebhook = (req: Request) => new URL(req.url).pathname === '/api/dodo/webhook'
const isApi = (req: Request) => new URL(req.url).pathname.startsWith('/api/')
const isOptions = (req: Request) => req.method === 'OPTIONS'

// Base CSP (valid, compact)
const BASE = {
  "default-src": ["'self'"],
  "img-src": ["'self'", "data:", "https://img.clerk.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": ["'self'", "https://clerk.com", "https://*.clerk.com", "https://api.clerk.com", "https://challenges.cloudflare.com"],
  "script-src": ["'self'", "'unsafe-inline'", "https://clerk.com", "https://*.clerk.com", "https://api.clerk.com", "https://assets.clerk.com", "https://img.clerk.com", "https://challenges.cloudflare.com"],
} as const

const serialize = (d: Record<string, readonly string[]>) =>
  Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ')

const BASE_CSP = serialize(BASE)
const AUTH_CSP = serialize({
  ...BASE,
  "script-src": [...BASE["script-src"], "'unsafe-eval'", "'wasm-unsafe-eval'"],
})

export default clerkMiddleware(
  async (auth, req) => {
    try {
      // 0) Fast exits that should never auth/protect or mutate headers
      if (isHealth(req) || isWebhook(req) || isOptions(req)) {
        return NextResponse.next()
      }

      // 1) Protect APIs (except bypasses above)
      if (isApi(req)) {
        await auth.protect() // v6 pattern (middleware), throws → Clerk handles 401/redirects
      }

      // 2) Attach CSP + common hardening (safe to set on NextResponse.next())
      const res = NextResponse.next()
      res.headers.set('Content-Security-Policy', isAuthRoute(req) ? AUTH_CSP : BASE_CSP)
      res.headers.set('Referrer-Policy', 'no-referrer')
      res.headers.set('X-Content-Type-Options', 'nosniff')
      res.headers.set('X-Frame-Options', 'DENY')
      res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      return res
    } catch (err) {
      // Never crash the edge runtime — degrade gracefully
      const res = NextResponse.next()
      res.headers.set('Content-Security-Policy', BASE_CSP)
      return res
    }
  },
  // Turn on Clerk's middleware debugging (shows up in Vercel logs)
  { debug: true },
)

// Match API and SPA routes; exclude static/runtime correctly (Clerk docs pattern)
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
} 