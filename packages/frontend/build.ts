// esbuild.config.mjs

import { builtinModules } from "node:module";
import { build } from "esbuild-wasm";
import { $ } from "zx";

await $`rm -rf dist`;

const builtins = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

await build({
	entryPoints: ["./src/app.ts"],
	outdir: "dist",
	bundle: true,
	platform: "browser",
	format: "esm",
	splitting: true,
	external: builtins,
	loader: {
		".woff": "file",
		".woff2": "file",
	},
	entryNames: "assets/[name]",
	chunkNames: "assets/[name]-[hash]",
	assetNames: "assets/[name]-[hash]",
	logLevel: "info",
});

await $`cp public/index.html dist/`;
