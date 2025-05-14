import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	root: "./src",
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
