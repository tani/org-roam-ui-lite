import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/server.ts'],
  platform: 'node',
  target: 'node20',
  format: ['esm'],
  bundle: true,
  noExternal: [/.*/],
  sourcemap: true,
  outDir: 'dist',
  shims: true,
  fixedExtension: true, // use always .cjs or .mjs
});
