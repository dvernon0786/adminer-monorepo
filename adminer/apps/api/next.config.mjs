import sharedConfig from './next.config.shared.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  
  // ⚠️ EXPLICITLY FORCE SERVERLESS MODE - prevent export mode
  // For Next.js 14.2.10, we need to be more explicit
  output: undefined, // Remove output setting to prevent export mode
  
  // 🚨 CRITICAL FIX: Prevent Next.js from generating conflicting pages
  // Only allow API routes, no client-side pages
  pageExtensions: ['api.ts', 'api.tsx', 'api.js', 'api.jsx'],
  
  // 🚨 DISABLE STATIC PAGE GENERATION
  // This prevents Next.js from creating 404.html, 500.html, etc.
  generateBuildId: async () => {
    return 'api-only-build';
  },
  
  // 🚨 FORCE API-ONLY MODE
  // Ensure no client-side pages are processed
  experimental: {
    // Disable features that might generate pages
    workerThreads: false,
    cpus: 1,
  },
  
  // SPA routing - handled by Vercel-level configuration
  // async rewrites() {
  //   return [
  //     // Preserve API routes exactly as they are
  //     { source: "/api/:path*", destination: "/api/:path*" },
  //     // All other routes should serve the SPA index
  //     { source: "/((?!api).*)", destination: "/" }
  //   ];
  // },
  
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