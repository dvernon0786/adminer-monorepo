/** @type {import('next').NextConfig} */
const isPreview = process.env.VERCEL_ENV === 'preview';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isPreview ? " https://vercel.live" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://api.clerk.com https://*.clerk.com https://api.dodopayments.com${isPreview ? " https://*.vercel.live" : ""}`,
  "base-uri 'self'",
  "form-action 'self'",
  `${isPreview ? "frame-src 'self' https://vercel.live" : "frame-src 'self'"}`
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
          { key: 'Content-Security-Policy', value: csp },
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