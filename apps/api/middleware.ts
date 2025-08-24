import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isApi = createRouteMatcher(['/api/(.*)', '/trpc/(.*)']);
const isDashboard = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(
  async (auth, req) => {
    try {
      const url = new URL(req.url);
      const { pathname, searchParams } = url;
      const res = NextResponse.next();

      // mark the route as public or protected
      const public = !(isApi(req) || isDashboard(req));
      res.headers.set("x-debug-route", url.pathname);
      res.headers.set("x-debug-public", public ? "true" : "false");

      // Bypass health so curl doesn't hit MIDDLEWARE_INVOCATION_FAILED
      if (pathname === '/api/consolidated' && searchParams.get('action') === 'health') {
        return res;
      }

      if (isApi(req) || isDashboard(req)) {
        const s = await auth.protect(); // 401 when signed out
        res.headers.set("x-debug-user", s?.userId ? "yes" : "no");
        res.headers.set("x-debug-protected", "true");
      }
      
      return res;
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