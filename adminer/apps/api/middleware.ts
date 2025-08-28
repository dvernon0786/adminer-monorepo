import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API and Next.js internal routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Skip static files with extensions
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Everything else gets rewritten to index.html
  return NextResponse.rewrite(new URL('/index.html', req.url));
}

// Simpler matcher - catch everything except API and Next.js
export const config = {
  matcher: ['/((?!api|_next).*)'],
};
