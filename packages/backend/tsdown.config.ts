import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/org-roam-ui-lite.ts",
	platform: "node",
	deps: { alwaysBundle: [/.*/u] },
	shims: true,
});
