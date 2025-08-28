import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Allow API, Next internals, and your public known files/dirs
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // 2) If it looks like a real file (has an extension), let it pass
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // 3) Everything else → SPA index.html
  return NextResponse.rewrite(new URL('/index.html', req.url));
}

// Limit middleware to everything except the common exclusions above.
// (We still defensively check in code for extensions / assets)
export const config = {
  matcher: ['/((?!api|_next|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'],
};
