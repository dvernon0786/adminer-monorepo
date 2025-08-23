/** @type {import('next').NextConfig} */
const isPreview = process.env.VERCEL_ENV === 'preview';
const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

// Configure Clerk domains
const CLERK_DOMAIN = 'https://clerk.adminer.online';
const CLERK_API = 'https://api.clerk.com';

const csp = [
  "default-src 'self'",
  // Allow your SPA JS + Clerk loader; keep inline for Vite's inline preloads
  `script-src 'self' 'unsafe-inline' ${CLERK_DOMAIN}${isProd ? '' : " 'unsafe-eval'"}`,
  // Google Fonts stylesheet - need both style-src and style-src-elem
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Images (SPA, data URLs, Clerk assets, blobs)
  "img-src 'self' data: blob:",
  // Font files from Google Fonts
  "font-src 'self' https://fonts.gstatic.com data:",
  // XHR/WebSocket targets (Clerk SDK talks to its APIs and your Clerk domain)
  `connect-src 'self' ${CLERK_API} ${CLERK_DOMAIN} https://*.clerk.com https://*.clerk.services https://api.dodopayments.com${isPreview ? " https://*.vercel.live" : ""}`,
  // Iframes (keep preview support; remove vercel.live in prod if you prefer)
  "frame-src 'self' https://vercel.live",
  // Workers & wasm
  "worker-src 'self' blob:",
  // Hardening
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig = {
  reactStrictMode: true,

  // Ensure static files are served correctly
  experimental: {
    // Force Next.js to serve static files from public/
    // Note: staticPageGenerationTimeout is not a valid option in Next.js 14
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  async rewrites() {
    return {
      // Normalize old URLs early (works even if HTML is cached somewhere)
      beforeFiles: [
        { source: '/public/assets/:path*', destination: '/assets/:path*' },
        { source: '/public/env.js', destination: '/env.js' },
      ],
      // Do NOT put a catch-all here; it can shadow static files.
      afterFiles: [],
      // Only hit SPA index.html if nothing else (pages, api, public files) matched
      fallback: [{ source: '/:path*', destination: '/index.html' }],
    };
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