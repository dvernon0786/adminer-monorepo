import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // ensure assets resolve to /assets/* when index.html lives at /
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
}); 