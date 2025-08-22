/** @type {import('next').NextConfig} */
const isPreview = process.env.VERCEL_ENV === 'preview';

const cspDirectives = [
  "default-src 'self'",
  // In preview, allow vercel.live script to avoid console noise; keep prod tighter
  `script-src 'self' 'unsafe-inline'${isPreview ? ' https://vercel.live' : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Clerk + payments + vercel live in preview for ws/events
  `connect-src 'self' https://api.clerk.com https://*.clerk.com https://api.dodopayments.com${isPreview ? ' https://*.vercel.live' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
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
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspDirectives },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  async rewrites() {
    return {
      // 1) beforeFiles: strip accidental /public prefix in URLs (fixes current deploy)
      beforeFiles: [
        { source: '/public/env.js', destination: '/env.js' },
        { source: '/public/assets/:path*', destination: '/assets/:path*' },
        // Catch any other /public/* paths and strip the prefix
        { source: '/public/:path*', destination: '/:path*' },
      ],

      // 2) afterFiles: let filesystem (_next, assets, api, etc.) win first,
      // then send all app routes to SPA index.html
      afterFiles: [
        // Explicitly serve static assets first
        { source: '/assets/:path*', destination: '/assets/:path*' },
        { source: '/env.js', destination: '/env.js' },
        
        // SPA routes
        { source: '/', destination: '/index.html' },
        { source: '/dashboard', destination: '/index.html' },
        { source: '/dashboard/:path*', destination: '/index.html' },

        // catch-all SPA routes except known system/asset paths
        // path-to-regexp syntax: named param with negative lookahead group
        { source: '/:path((?!api|_next|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml|env\\.js).*)', destination: '/index.html' },
      ],

      // no fallback rewrites
      fallback: [],
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