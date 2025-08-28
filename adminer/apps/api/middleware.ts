export function middleware() {
  // intentionally no-ops — let vercel.json routes handle SPA fallback
}
export const config = {
  // limit middleware to nothing by default; expand later if needed
  matcher: []
};
