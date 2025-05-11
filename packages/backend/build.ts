// esbuild.config.mjs

import { builtinModules } from "node:module";
import { build } from "esbuild-wasm";
import { fs } from "zx";

await fs.remove("./dist");

const builtins = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

await build({
	entryPoints: ["src/backend.ts"],
	outdir: "./dist",
	bundle: true,
	platform: "node",
	format: "esm",
	sourcemap: true,
	external: builtins,
	loader: {
		".wasm": "file",
	},
	banner: {
		js: `
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const __dirname = import.meta.dirname;
`,
	},
	logLevel: "info",
});
