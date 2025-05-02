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
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  banner(ctx) {
    if (ctx.format === "esm") {
      return {
        js: `
          import { createRequire } from 'node:module';
          const require = createRequire(import.meta.url);
          const __dirname = import.meta.dirname;
        `,
      };
    }
  },
});
