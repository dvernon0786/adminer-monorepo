import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isApi = createRouteMatcher(['/api/(.*)', '/trpc/(.*)']);
const isDashboard = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(
  async (auth, req) => {
    try {
      const url = new URL(req.url);
      const { pathname, searchParams } = url;

      // Bypass health so curl doesn't hit MIDDLEWARE_INVOCATION_FAILED
      if (pathname === '/api/consolidated' && searchParams.get('action') === 'health') {
        return NextResponse.next();
      }

      if (isApi(req) || isDashboard(req)) {
        await auth.protect(); // 401 when signed out
      }
    } catch (err) {
      console.error('middleware error', err);
      // Never throw from middleware on Vercel
      return new NextResponse('middleware_error', { status: 200 });
    }
  },
  { debug: true }
);

export const config = {
  matcher: [
    '/api/(.*)',
    '/trpc/(.*)',
    '/dashboard/(.*)',
  ],
}; 