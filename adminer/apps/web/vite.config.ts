import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: '/', // ensure assets resolve to /assets/* when index.html lives at /
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Inject Clerk publishable key at build time
      __VITE_CLERK_PUBLISHABLE_KEY__: JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY),
      // Add build timestamp for cache busting
      __BUILD_TIMESTAMP__: JSON.stringify(Date.now())
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
      // Force source maps for debugging
      sourcemap: false,
      // Ensure clean builds
      emptyOutDir: true,
      // Use esbuild minification (default, no extra dependencies)
      minify: 'esbuild'
    },
  };
}); 