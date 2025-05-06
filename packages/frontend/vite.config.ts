// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
	base: './',
	build: {
		outDir: "dist/",
		emptyOutDir: true,
		sourcemap: true,
		target: "es2022",
		rollupOptions: {
			input: "index.html",
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
