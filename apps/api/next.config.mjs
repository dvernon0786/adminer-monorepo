/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ensure static files are served correctly
  experimental: {
    // Force Next.js to serve static files from public/
    // Note: staticPageGenerationTimeout is not a valid option in Next.js 14
  },

  async headers() {
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    const isProd = env === 'production';

    // Clerk + Fonts allowlists
    const clerkHosts = [
      "https://clerk.adminer.online",
      "https://*.clerk.com",
      "https://*.clerk.services"
    ];
    const fontsCss = "https://fonts.googleapis.com";
    const fontsFiles = "https://fonts.gstatic.com";

    // We allow 'unsafe-eval' in PREVIEW/DEV because Clerk + devtools may need it.
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...clerkHosts,
      !isProd ? "'unsafe-eval'" : null
    ].filter(Boolean).join(' ');

    // Matching script-src-elem for external <script src=...> (Clerk)
    const scriptSrcElem = [
      "'self'",
      "'unsafe-inline'",
      ...clerkHosts,
      !isProd ? "'unsafe-eval'" : null
    ].filter(Boolean).join(' ');

    // style-src controls inline styles; style-src-elem controls <link rel="stylesheet"> like Google Fonts CSS
    const styleSrc = [
      "'self'",
      "'unsafe-inline'"
    ].join(' ');

    const styleSrcElem = [
      "'self'",
      "'unsafe-inline'",
      fontsCss
    ].join(' ');

    const fontSrc = [
      "'self'",
      fontsFiles,
      "data:"
    ].join(' ');

    const connectSrc = [
      "'self'",
      ...clerkHosts,
      "https://api.dodopayments.com"
    ].join(' ');

    const imgSrc = [
      "'self'",
      "data:",
      "blob:"
    ].join(' ');

    const workerSrc = [
      "'self'",
      "blob:"
    ].join(' ');

    const csp = [
      `default-src 'self'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'self'`,
      `object-src 'none'`,
      `script-src ${scriptSrc}`,
      `script-src-elem ${scriptSrcElem}`,
      `style-src ${styleSrc}`,
      `style-src-elem ${styleSrcElem}`,
      `font-src ${fontSrc}`,
      `connect-src ${connectSrc}`,
      `img-src ${imgSrc}`,
      `worker-src ${workerSrc}`,
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
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