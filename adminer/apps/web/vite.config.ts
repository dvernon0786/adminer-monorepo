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
    },
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
  };
}); 