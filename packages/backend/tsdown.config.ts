import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/serve.ts", "src/dump.ts"],
	platform: "node",
	deps: { alwaysBundle: [/.*/] },
	shims: true,
});
