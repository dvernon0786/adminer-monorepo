/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "x-guard-active", value: "1" },
          // Content Security Policy to catch path mistakes quickly
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
          }
        ],
      },
    ];
  },
  // Ensure SPA assets and index are served correctly
  async rewrites() {
    return [
      // strip any accidental /public prefix in URLs
      { source: '/public/:path*', destination: '/:path*' },

      // serve the SPA index for your app routes
      { source: '/', destination: '/index.html' },
      { source: '/dashboard', destination: '/index.html' },

      // SPA fallback for any non-API, non-next, non-asset path
      {
        source: '/:path((?!api|_next|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml|env\\.js).*)',
        destination: '/index.html',
      },
    ];
  },
  // (Optional) no redirects needed; rewrites keep the URL nice
};

export default nextConfig; 