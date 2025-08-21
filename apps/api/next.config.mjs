/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "x-guard-active", value: "1" }],
      },
    ];
  },
  // Remove problematic rewrites that were serving index.html for all routes
  // Next.js will now properly serve static assets from public/ directory
};

export default nextConfig; 