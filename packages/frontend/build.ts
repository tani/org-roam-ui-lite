// esbuild.config.mjs

import { builtinModules } from "node:module";
import { build } from "esbuild-wasm";
import { fs } from "zx";

await fs.remove("./dist");
await fs.mkdirp("./dist");
await fs.copy("./public/index.html", "./dist/index.html");

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
