import { NextResponse, NextRequest } from 'next/server'

// Update to your canonical hosts
const APEX = 'adminer.online'
const WWW  = `www.${APEX}`

// Paths that middleware should ignore entirely
const IGNORE_PREFIXES = [
  '/api/',               // Next API routes
  '/_next/',             // Next internals
  '/assets/',            // SPA assets copied to public/
  '/favicon', '/robots', '/sitemap', '/manifest',
  '/.well-known/',       // ACME etc.
]

export const config = {
  matcher: ['/((?!_next|static).*)'], // run on most paths but we still early-return below
}

export default function middleware(req: NextRequest) {
  const url = new URL(req.url)

  // 1) Short-circuit: ignore paths we shouldn't touch
  if (IGNORE_PREFIXES.some(p => url.pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 2) Force apex (www -> apex) safely using hostname (no ports)
  const hostname = url.hostname

  if (hostname === WWW) {
    url.hostname = APEX
    // If you also want HTTPS enforcement, uncomment the next line:
    // url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  // If someone hits an unexpected host, optionally normalize to apex.
  // (Keeps previews working because Vercel previews won't match WWW/APEX.)
  if (hostname !== APEX && !hostname.endsWith('.vercel.app')) {
    url.hostname = APEX
    return NextResponse.redirect(url, 301)
  }

  // 3) Default: continue
  return NextResponse.next()
} 