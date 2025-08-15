import { readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { defineConfig } from "vite";

const externals = builtinModules.concat(builtinModules.map((m) => `node:${m}`));

function wasmBinary() {
	return {
		name: "wasm-binary",
		load(id: string) {
			if (id.endsWith(".wasm")) {
				const base64 = readFileSync(id).toString("base64");
				return `export default Buffer.from("${base64}", "base64");`;
			}
		},
	};
}

export default defineConfig({
	plugins: [wasmBinary()],
	build: {
		target: "node18",
		lib: {
			entry: {
				serve: "src/serve.ts",
				dump: "src/dump.ts",
			},
			formats: ["es"],
			fileName: "[name]",
		},
		rollupOptions: {
			external: [...externals, "sql.js"],
			output: {
				entryFileNames: "[name].js",
			},
		},
		outDir: "dist",
	},
});
