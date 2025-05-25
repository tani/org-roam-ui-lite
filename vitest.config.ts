// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// root のデフォルト環境は node のまま
		environment: "node",
		coverage: {
			enabled: true,
			reporter: ["text", "json", "html"],
			include: ["packages/*/src/**"],
		},

		// 2つの inline プロジェクトを定義
		projects: [
			{
				// root の設定（plugins など）を継承
				extends: true,
				test: {
					name: "frontend",
					include: ["packages/frontend/test/**/*.test.{ts,tsx}"],
					environment: "jsdom", // フロントエンドは jsdom
				},
			},
			{
				extends: true,
				test: {
					name: "backend",
					include: ["packages/backend/test/**/*.test.ts"],
					environment: "node", // バックエンドは node
				},
			},
		],
	},
});
