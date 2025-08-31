import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Ensure consistent bundle naming
    rollupOptions: {
      output: {
        // Use content hash for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Ensure deterministic builds
        manualChunks: undefined
      }
    },
    // Force source maps for debugging
    sourcemap: false,
    // Ensure clean builds
    emptyOutDir: true,
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Environment variable handling
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(Date.now())
  }
}) 