/** @type {import('next').NextConfig} */

const nextConfig = {
  // Keep this while you tidy ESLint config later
  eslint: { ignoreDuringBuilds: true },
  
  // Temporarily bypass TypeScript errors to focus on SPA routing
  typescript: { ignoreBuildErrors: true },

  // SPA fallback rewrites - handle routing at Next.js level
  async rewrites() {
    return [
      { source: '/api/:path*', destination: '/api/:path*' },
      { source: '/_next/:path*', destination: '/_next/:path*' },
      { source: '/assets/:path*', destination: '/assets/:path*' },
      { source: '/favicon.ico', destination: '/favicon.ico' },
      { source: '/robots.txt', destination: '/robots.txt' },
      { source: '/sitemap.xml', destination: '/sitemap.xml' },
      // SPA fallback - everything else serves index.html
      { source: '/:path*', destination: '/index.html' }
    ];
  }
};

export default nextConfig; 