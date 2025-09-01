import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Fix: Match TypeScript paths from tsconfig.base.json
      // Base config is at adminer/, web app is at adminer/apps/web/
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types')
    }
  },
  build: {
    // Ensure consistent bundle naming
    rollupOptions: {
      output: {
        // Use content hash only for cache busting (removed timestamp)
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        // Ensure deterministic builds
        manualChunks: undefined
      }
    },
    // Force source maps for debugging
    sourcemap: true,
    // Ensure clean builds
    emptyOutDir: true,
    // DISABLE MINIFICATION to prevent component name mangling
    minify: false,
    // Remove problematic terser options
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true
    //   }
    // }
  },
  // Environment variable handling
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(Date.now()),
    __VITE_CLERK_PUBLISHABLE_KEY__: JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY)
  }
}) 