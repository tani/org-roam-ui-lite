// vitest.config.ts

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configure Vitest with project settings.
 */
export default defineConfig({
	resolve: {
		alias: {
			"rehype-mathjax": fileURLToPath(
				new URL("./packages/rehype-mathjax/src/browser.ts", import.meta.url),
			),
			"rehype-mermaid": fileURLToPath(
				new URL("./packages/rehype-mermaid/src/index.ts", import.meta.url),
			),
		},
	},
	test: {
		// default environment for the root project
		environment: "node",
		pool: "threads",
		testTimeout: 30000,
		coverage: {
			enabled: true,
			reporter: ["text", "json", "html"],
			include: ["packages/*/src/**"],
			exclude: ["**/*~"],
		},

		// define inline projects
		projects: [
			{
				// inherit root settings
				extends: true,
				test: {
					name: "frontend",
					include: ["packages/frontend/test/**/*.test.{ts,tsx}"],
					environment: "happy-dom", // frontend uses happy-dom for better React support
					setupFiles: ["packages/frontend/test/setup.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "backend",
					include: ["packages/backend/test/**/*.test.ts"],
					environment: "node", // backend uses node
				},
			},
			{
				extends: true,
				test: {
					name: "rehype-mermaid",
					include: ["packages/rehype-mermaid/test/**/*.test.ts"],
					environment: "node",
				},
			},
			{
				extends: true,
				test: {
					name: "rehype-mathjax",
					include: ["packages/rehype-mathjax/test/**/*.test.ts"],
					environment: "node",
				},
			},
		],
	},
});
