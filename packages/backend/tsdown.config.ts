import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/cli.ts", "src/serve.ts", "src/dump.ts", "src/populate.ts"],
	platform: "node",
	deps: { alwaysBundle: [/.*/] },
	shims: true,
});
