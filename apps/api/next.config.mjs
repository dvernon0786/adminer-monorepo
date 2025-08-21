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
  // Serve SPA from public directory
  async rewrites() {
    return [
      {
        source: "/(.*)",
        destination: "/public/index.html",
      },
    ];
  },
};

export default nextConfig; 