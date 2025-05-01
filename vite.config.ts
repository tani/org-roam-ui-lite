// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  base: '/client/',
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2024',
    rollupOptions: {
      input: 'client/index.html',
    },
  },
});
