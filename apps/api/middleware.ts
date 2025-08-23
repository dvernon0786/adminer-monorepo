import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isApi = createRouteMatcher(['/api/(.*)', '/trpc/(.*)']);
const isDashboard = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(
  async (auth, req) => {
    if (isApi(req) || isDashboard(req)) {
      await auth.protect(); // 401 when signed out
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