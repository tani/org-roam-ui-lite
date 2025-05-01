import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: 'server/server.ts',   // Node バンドル
    outDir: 'dist/server',
    target: 'node20',
    sourcemap: true,
    rollupOptions: {
      external: [
        'node:fs',
        'node:path',
        'node:url',
        '@hono/node-server',
        '@hono/node-server/serve-static',
        '@libsql/client',
      ],
      output: { entryFileNames: 'server.js', format: 'es' },
    },
  }
});
