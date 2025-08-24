/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ensure static files are served correctly
  experimental: {
    // Force Next.js to serve static files from public/
    // Note: staticPageGenerationTimeout is not a valid option in Next.js 14
  },

  async headers() {
    const clerkHosts = [
      "https://clerk.com",        // ⬅ root needed for pinned script
      "https://*.clerk.com",
      "https://api.clerk.com",
      "https://assets.clerk.com",
      "https://img.clerk.com",    // ⬅ needed for Clerk user images
    ];

    const googleFonts = [
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
    ];

    const dodo = ["https://api.dodopayments.com"]; // ⬅ fix build failure

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkHosts.join(" ")}`,
      `script-src-elem 'self' 'unsafe-inline' ${clerkHosts.join(" ")}`,
      `style-src 'self' 'unsafe-inline' ${googleFonts[0]}`,
      `style-src-elem 'self' 'unsafe-inline' ${googleFonts[0]}`,
      `font-src 'self' data: ${googleFonts[1]}`,
      `img-src 'self' data: ${clerkHosts.join(" ")}`,
      `connect-src 'self' ${clerkHosts.join(" ")} ${dodo.join(" ")}`,
      `frame-src 'self' ${clerkHosts.join(" ")}`,
      `worker-src 'self' blob:`,
    ].join("; ");

    return [
      // Make env.js uncacheable at the CDN
      {
        source: '/env.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // API & SPA root
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      // Normalize old URLs early (works even if HTML is cached somewhere)
      { source: '/public/assets/:path*', destination: '/assets/:path*' },
      { source: '/public/env.js', destination: '/env.js' },
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