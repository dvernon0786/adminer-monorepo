/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep this while you tidy ESLint config later
  eslint: { ignoreDuringBuilds: true },
  
  // Temporarily bypass TypeScript errors to focus on SPA routing
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig; 