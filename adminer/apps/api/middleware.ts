import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the request is for the API, let it pass through
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // If the request is for Next.js internals, let it pass through
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // If the request has a file extension, let it pass through
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // For all other requests, rewrite to the index.html file
  return NextResponse.rewrite(new URL('/index.html', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
