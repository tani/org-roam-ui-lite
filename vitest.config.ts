// vitest.config.ts

import { defineConfig } from "vitest/config";

/**
 * Configure Vitest with project settings.
 */
export default defineConfig({
	test: {
		// default environment for the root project
		environment: "node",
		coverage: {
			enabled: true,
			reporter: ["text", "json", "html"],
			include: ["packages/*/src/**"],
		},

		// define two inline projects
		projects: [
			{
				// inherit root settings
				extends: true,
				test: {
					name: "frontend",
					include: [
						"packages/frontend/src/test/**/*.test.{ts,tsx}",
						"packages/frontend/src/**/test/*.test.{ts,tsx}",
					],
					environment: "jsdom", // frontend uses jsdom
					setupFiles: ["packages/frontend/src/test/setup.ts"],
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
		],
	},
});
