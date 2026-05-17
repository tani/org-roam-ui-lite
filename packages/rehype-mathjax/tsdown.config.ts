import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/browser.ts"],
	platform: "node",
	dts: true,
});
