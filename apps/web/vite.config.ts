import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // ensure assets resolve to /assets/* when index.html lives at /
  server: {
    proxy: {
      // Let the web dev server fetch env.js and Clerk proxy from the API dev server
      '^/(env\\.js|clerk)(/.*)?$': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Ensure asset paths are generated correctly for Vercel
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
}); 