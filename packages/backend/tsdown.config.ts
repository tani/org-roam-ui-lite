import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/serve.ts", "src/dump.ts"],
	platform: "node",
	noExternal: [/.*/],
	shims: true,
	inputOptions: {
		moduleTypes: {
			".wasm": "binary",
		},
	},
});
