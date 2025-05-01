// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2024',
    rollupOptions: {
      input: 'index.html',
    },
  },
});
