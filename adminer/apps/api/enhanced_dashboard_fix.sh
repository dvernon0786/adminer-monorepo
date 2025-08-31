#!/bin/bash
set -e

echo "🔧 ENHANCED DASHBOARD RESOLUTION SCRIPT"
echo "======================================="

# 1. Fix Web App Build Process
echo "1. Building web app with proper environment variables..."
cd ../web

# Ensure proper Vite config without Next.js assumptions
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    __VITE_CLERK_PUBLISHABLE_KEY__: JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
