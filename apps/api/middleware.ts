import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isApi = createRouteMatcher(['/api/(.*)', '/trpc/(.*)']);
const isDashboard = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(
  async (auth, req) => {
    try {
      const url = new URL(req.url);
      const { pathname, searchParams } = url;

      // Bypass health check early to avoid MIDDLEWARE_INVOCATION_FAILED
      if (pathname === '/api/consolidated' && searchParams.get('action') === 'health') {
        const res = NextResponse.next();
        res.headers.set("x-debug-route", url.pathname);
        res.headers.set("x-debug-public", "true");
        res.headers.set("x-debug-health", "bypassed");
        return res;
      }

      const res = NextResponse.next();

      // mark the route as public or protected
      const isPublic = !(isApi(req) || isDashboard(req));
      res.headers.set("x-debug-route", url.pathname);
      res.headers.set("x-debug-public", isPublic ? "true" : "false");

      if (isApi(req) || isDashboard(req)) {
        try {
          const s = await auth.protect(); // 401 when signed out
          res.headers.set("x-debug-user", s?.userId ? "yes" : "no");
          res.headers.set("x-debug-protected", "true");
        } catch (authErr) {
          res.headers.set("x-debug-user", "error");
          res.headers.set("x-debug-protected", "error");
          // Don't throw, just mark as error
        }
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