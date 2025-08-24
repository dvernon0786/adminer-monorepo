/** @type {import('next').NextConfig} */
const isProd = process.env.VERCEL_ENV === 'production';
const isPreview = process.env.VERCEL_ENV === 'preview';

const CF_TURNSTILE = 'https://challenges.cloudflare.com';
const GF_CSS = 'https://fonts.googleapis.com';
const GF_FILES = 'https://fonts.gstatic.com';
const CLERK_CUSTOM = 'https://clerk.adminer.online';
const CLERK_HOSTS = [
  'https://clerk.com',
  'https://*.clerk.com',
  'https://api.clerk.com',
  'https://assets.clerk.com',
  'https://img.clerk.com'
];
const DODO_API = 'https://api.dodopayments.com';
const PREVIEW_CONNECT = isProd ? [] : ['https://vercel.live', 'wss://vercel.live'];

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",

  // --- Scripts ---
  // Keep both generic and -elem for maximum browser compatibility.
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",                 // needed by Clerk embed
    (!isProd) ? "'unsafe-eval'" : "",  // allow in preview/dev only
    CLERK_CUSTOM,
    CF_TURNSTILE,
    ...CLERK_HOSTS
  ].filter(Boolean).join(' '),

  [
    "script-src-elem",
    "'self'",
    "'unsafe-inline'",
    CLERK_CUSTOM,
    CF_TURNSTILE,
    ...CLERK_HOSTS
  ].join(' '),

  // --- Styles / Fonts ---
  `style-src 'self' 'unsafe-inline' ${GF_CSS}`,
  `style-src-elem 'self' 'unsafe-inline' ${GF_CSS}`,
  `font-src 'self' ${GF_FILES} data:`,

  // --- Frames ---
  `frame-src 'self' ${CF_TURNSTILE}`,

  // --- Images ---
  `img-src 'self' data: blob: ${CF_TURNSTILE} https://img.clerk.com`,

  // --- Workers / Manifests ---
  "worker-src 'self' blob:",
  "manifest-src 'self'",

  // --- XHR / fetch / WS ---
  [
    "connect-src",
    "'self'",
    CLERK_CUSTOM,
    ...CLERK_HOSTS,
    CF_TURNSTILE,
    GF_CSS,
    GF_FILES,
    DODO_API,
    ...PREVIEW_CONNECT
  ].join(' ')
];

const nextConfig = {
  async headers() {
    return [
      {
        // Some internal scripts expect /(.*); keep this for compatibility
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp.join('; ') },
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