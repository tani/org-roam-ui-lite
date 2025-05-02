import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/server.ts'],
  platform: 'node',
  target: 'node20',
  format: ['esm'],
  bundle: true,
  noExternal: [/.*/],
  sourcemap: true,
  dts: true,
  outDir: 'dist',
  shims: true,
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
});
