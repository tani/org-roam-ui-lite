import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	root: `${import.meta.dirname}/src`,
	build: {
		outDir: `${import.meta.dirname}/dist`,
		emptyOutDir: true,
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
