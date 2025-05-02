import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  platform: 'node',
  target: 'node20',
  format: ['esm'],
  noExternal: [/.*/],
  sourcemap: true,
  dts: true,
  outDir: 'dist',
});
