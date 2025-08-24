/** @type {import('next').NextConfig} */
const isProd = process.env.VERCEL_ENV === 'production';
const isPreview = process.env.VERCEL_ENV === 'preview';

const turnstile = 'https://challenges.cloudflare.com';
const googleFontsCss = 'https://fonts.googleapis.com';
const googleFontsFiles = 'https://fonts.gstatic.com';
// Your Clerk subdomain observed in logs:
const clerkSubdomain = 'https://clerk.adminer.online';
// Dodo payment integration
const dodoApi = 'https://api.dodopayments.com';
// Clerk official domains
const clerkDomains = ['https://*.clerk.com', 'https://api.clerk.com', 'https://img.clerk.com'];

// Some preview tooling may use vercel.live; allow it only outside production.
const previewConnect = isProd ? [] : ['https://vercel.live', 'wss://vercel.live'];

const csp = [
  // Baseline
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",

  // Scripts (Turnstile + same-origin; Clerk runtime is served locally)
  `script-src 'self' 'unsafe-inline' ${!isProd ? "'unsafe-eval'" : ''}`,
  `script-src-elem 'self' 'unsafe-inline' ${turnstile} ${clerkDomains.join(' ')}`,

  // Styles (Google Fonts CSS + inline for font-loader hydration)
  `style-src 'self' 'unsafe-inline'`,
  `style-src-elem 'self' 'unsafe-inline' ${googleFontsCss}`,

  // Fonts (Google font files + data for robust loading)
  `font-src 'self' ${googleFontsFiles} data:`,

  // Frames (Turnstile widget + any same-origin frames)
  `frame-src 'self' ${turnstile}`,

  // Images (same-origin, data, blob; include Turnstile and Clerk just in case)
  `img-src 'self' data: blob: ${turnstile} https://img.clerk.com`,

  // Workers (allow blob for modern bundlers/runtimes when needed)
  "worker-src 'self' blob:",

  // Manifest (same-origin)
  "manifest-src 'self'",

  // *** The missing directive causing the build to fail ***
  // API/XHR/WebSocket endpoints our app legitimately talks to
  [
    "connect-src 'self'",
    clerkSubdomain,         // Clerk env + client calls (as seen in logs)
    dodoApi,                // Dodo payment API integration
    ...clerkDomains,        // Official Clerk domains
    turnstile,              // Turnstile verification/telemetry
    googleFontsCss,         // Preconnects from fonts CSS fetches can appear
    googleFontsFiles,       // Preconnects to font files
    ...previewConnect       // vercel.live only in preview
  ].join(' ')
];

// You can optionally add "report-to" / "report-uri" here if you run a CSP collector.

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp.join('; ')
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '0' }
        ]
      }
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