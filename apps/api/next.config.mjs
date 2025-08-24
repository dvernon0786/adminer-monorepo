/** @type {import('next').NextConfig} */

const csp = `
  default-src 'self';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';

  /* scripts */
  script-src 'self' 'unsafe-inline'
    https://clerk.com https://*.clerk.com https://api.clerk.com
    https://assets.clerk.com https://img.clerk.com
    https://clerk.adminer.online
    https://challenges.cloudflare.com;
  script-src-elem 'self' 'unsafe-inline'
    https://clerk.com https://*.clerk.com https://api.clerk.com
    https://assets.clerk.com https://img.clerk.com
    https://clerk.adminer.online
    https://challenges.cloudflare.com;

  /* connections (XHR/fetch) */
  connect-src 'self'
    https://api.clerk.com
    https://challenges.cloudflare.com;

  /* iframes (Turnstile widget) */
  frame-src 'self' https://challenges.cloudflare.com https://*.clerk.com;

  /* styles + fonts (Google Fonts) */
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;

  /* images */
  img-src 'self' data: blob: https://img.clerk.com https://challenges.cloudflare.com;

  /* workers (rarely needed, safe to allow self) */
  worker-src 'self' blob:;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "0" },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    return [
      // Normalize old URLs early (works even if HTML is cached somewhere)
      { source: '/public/assets/:path*', destination: '/assets/:path*' },
      // Do NOT put a catch-all here; it can shadow static files.
      // Only hit SPA index.html if nothing else (pages, api, public files) matched
      { source: '/:path*', destination: '/index.html' },
    ];
  },

  // Add redirects to force browser to use correct URLs
  async redirects() {
    return [
      // Force redirect from /public/assets/* to /assets/* to update browser URLs
      {
        source: '/public/assets/:path*',
        destination: '/assets/:path*',
        permanent: false, // Use 307/308 to avoid caching issues
      },
      // Catch any other /public/* paths
      {
        source: '/public/:path*',
        destination: '/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig; 