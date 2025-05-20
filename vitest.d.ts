declare module "vitest" {
	// biome-ignore lint/suspicious/noExplicitAny: typed via vitest when installed
	export const describe: any;
	// biome-ignore lint/suspicious/noExplicitAny: typed via vitest when installed
	export const it: any;
	// biome-ignore lint/suspicious/noExplicitAny: typed via vitest when installed
	export const expect: any;
	// biome-ignore lint/suspicious/noExplicitAny: typed via vitest when installed
	export const vi: any;
}

declare module "vitest/config" {
	// biome-ignore lint/suspicious/noExplicitAny: typed via vitest when installed
	export function defineConfig(config: any): any;
}
