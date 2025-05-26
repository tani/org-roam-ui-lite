// vitest.config.ts
// @ts-nocheck

import vue from "@vitejs/plugin-vue";
import type { PluginOption } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Configure Vitest with the Vue plugin and project settings.
 */
export default defineConfig({
	plugins: [vue()] as unknown as PluginOption[],
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
				// inherit root settings such as plugins
				extends: true,
				test: {
					name: "frontend",
					include: ["packages/frontend/test/**/*.test.ts"],
					environment: "jsdom", // frontend uses jsdom
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
