import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/backend.ts"],
	platform: "node",
	target: "node20",
	format: ["esm"],
	bundle: true,
	noExternal: [/.*/],
	sourcemap: true,
	outDir: "dist",
	shims: true,
	loader: {
		".wasm": "file",
	},
	outExtension({ format }) {
		return { js: format === "esm" ? ".mjs" : ".cjs" };
	},
	banner(ctx) {
		if (ctx.format === "esm") {
			return {
				js: `
					import { createRequire } from 'node:module';
					const require = createRequire(import.meta.url);
				`,
			};
		}
	},
});
