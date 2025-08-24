// apps/api/src/middleware.ts
import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Match auth routes including ALL nested steps
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

function isHealth(req: Request) {
  const url = new URL(req.url)
  return url.pathname === '/api/consolidated' && url.searchParams.get('action') === 'health'
}

function isWebhook(req: Request) {
  const url = new URL(req.url)
  return url.pathname === '/api/dodo/webhook'
}

/**
 * Build CSP strings safely. We duplicate BASE and only widen script-src for auth.
 */
const BASE = {
  "default-src": ["'self'"],
  "img-src": ["'self'", "data:", "https://img.clerk.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": [
    "'self'",
    "https://api.clerk.com",
    "https://clerk.com",
    "https://*.clerk.com",
    "https://challenges.cloudflare.com"
  ],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "https://clerk.com",
    "https://*.clerk.com",
    "https://api.clerk.com",
    "https://assets.clerk.com",
    "https://img.clerk.com",
    "https://challenges.cloudflare.com"
  ],
}

function serializeCsp(d: Record<string, string[]>) {
  return Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ')
}

const BASE_CSP = serializeCsp(BASE)

// Clone + widen script-src for auth flows
const AUTH = {
  ...BASE,
  "script-src": [...BASE["script-src"], "'unsafe-eval'", "'wasm-unsafe-eval'"],
}
const AUTH_CSP = serializeCsp(AUTH)

export default clerkMiddleware(async (auth, req) => {
  try {
    // 1) Early exits
    if (isHealth(req)) return NextResponse.next()

    // 2) Protect API except webhook + health
    const { pathname } = new URL(req.url)
    if (pathname.startsWith('/api/') && !isWebhook(req) && !isHealth(req)) {
      try {
        console.log('Middleware: Protecting API route:', pathname)
        // ✅ auth is an OBJECT, not a function
        await auth.protect()
        console.log('Middleware: Auth protection successful')
      } catch (authError) {
        console.error('Auth protection failed:', authError)
        return new NextResponse('Unauthorized', { status: 401 })
      }
    }

    // 3) Attach correct CSP
    const res = NextResponse.next()
    const isAuth = isAuthRoute(req)
    console.log('Middleware: Route:', pathname, 'isAuth:', isAuth)
    res.headers.set('Content-Security-Policy', isAuth ? AUTH_CSP : BASE_CSP)

    // Optional hardening
    res.headers.set('Referrer-Policy', 'no-referrer')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    console.log('Middleware: Headers set successfully')
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Return a safe response instead of crashing
    const res = NextResponse.next()
    res.headers.set('Content-Security-Policy', BASE_CSP)
    return res
  }
})

export const config = {
  matcher: [
    '/api/:path*',
    // Run on all SPA routes, but skip static files/runtime
    '/((?!_next|static|clerk-runtime|vendor|assets|.*\\.(?:js|css|map|png|jpg|svg|ico|txt)$).*)',
  ],
} 