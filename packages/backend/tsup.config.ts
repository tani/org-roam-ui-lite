import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/backend.ts"],
	platform: "node",
	format: ["esm"],
	noExternal: [/.*/],
	sourcemap: true,
	outDir: "dist",
	shims: true,
	loader: {
		".wasm": "file",
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
