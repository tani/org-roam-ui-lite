import { defineConfig } from "tsup";

export default defineConfig({
	publicDir: true,
	entry: ["src/app.ts"],
	platform: "browser",
	format: ["esm"],
	noExternal: [/.*/],
	sourcemap: true,
	outDir: "dist/",
	shims: true,
	loader: {
		".wasm": "file",
		".woff": "file",
		".woff2": "file",
	},
	esbuildOptions(options) {
		options.entryNames = "assets/[name]";
		options.chunkNames = "assets/[name]-[hash]";
		options.assetNames = "assets/[name]-[hash]";
	},
});
