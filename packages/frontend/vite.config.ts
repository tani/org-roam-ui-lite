/// <reference types="vitest" />

import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	base: "./",
	plugins: [react()],
	resolve: {
		alias: {
			"rehype-mathjax": fileURLToPath(
				new URL("../rehype-mathjax/src/browser.ts", import.meta.url),
			),
			"rehype-mermaid": fileURLToPath(
				new URL("../rehype-mermaid/src/index.ts", import.meta.url),
			),
		},
	},
	server: {
		port: 5173,
		proxy: {
			"/api": {
				target: "http://localhost:5174",
				changeOrigin: true,
			},
		},
	},
});
