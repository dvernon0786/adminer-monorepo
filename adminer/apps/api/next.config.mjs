import sharedConfig from './next.config.shared.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  
  // ⚠️ EXPLICITLY FORCE SERVERLESS MODE - prevent export mode
  // For Next.js 14.2.10, we need to be more explicit
  output: undefined, // Remove output setting to prevent export mode
  
  // SPA routing - handle client-side routes (exclude API routes)
  async rewrites() {
    return [
      // Preserve API routes exactly as they are
      { source: "/api/:path*", destination: "/api/:path*" },
      // All other routes should serve the SPA index
      { source: "/((?!api).*)", destination: "/" }
    ];
  },
  
  // Environment variable overrides to prevent export mode
  env: {
    // Force disable any export-related environment variables
    NEXT_EXPORT: 'false',
    VERCEL_EXPORT: 'false',
    // Vercel-specific overrides
    VERCEL: '1',
    VERCEL_ENV: 'production',
  }
};

export default nextConfig; 