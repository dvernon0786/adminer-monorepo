/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['inngest'],
  env: {
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  },
  outputFileTracingRoot: '/home/dghost/Desktop/ADminerFinal/adminer/apps/api'
}

export default nextConfig