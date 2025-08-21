import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // If the URL has a dot-extension (e.g., .js, .css, .png) treat as static.
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname)

  // Allow Next/Vercel to serve:
  // - /_next/*
  // - /assets/*
  // - any file with extension
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    hasExtension
  ) {
    return NextResponse.next()
  }

  // Let API calls run normally
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Everything else is client-routed SPA → rewrite to /index.html
  const url = req.nextUrl.clone()
  url.pathname = '/index.html'
  return NextResponse.rewrite(url)
}

// Only run on routes that could be SPA paths.
// Exclude: /api, /_next, /assets, and common static roots by matcher.
export const config = {
  matcher: [
    // match everything except known static/next/api buckets
    '/((?!api|_next|assets|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
} 