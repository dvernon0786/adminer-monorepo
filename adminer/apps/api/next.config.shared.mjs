// Shared Next.js configuration that prevents export mode for API app
const isApi = process.cwd().endsWith("/apps/api");

const sharedConfig = {
  // Never export in API app
  ...(isApi ? {} : { output: "export" }),
  
  // Common settings
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true }
};

export default sharedConfig; 