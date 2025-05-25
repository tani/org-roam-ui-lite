/**
 * Utility functions for color and CSS variables.
 */

/**
 * Read a CSS variable value.
 *
 * @param name - CSS custom property name
 * @returns Resolved value
 */
export function getCssVariable(name: string): string {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
}

const ACCENT_VARIABLES = [
	"--bs-blue",
	"--bs-indigo",
	"--bs-purple",
	"--bs-pink",
	"--bs-red",
	"--bs-orange",
	"--bs-yellow",
	"--bs-green",
	"--bs-teal",
	"--bs-cyan",
] as const;

/**
 * Deterministically pick a color based on a string key.
 *
 * @param key - String used for color selection
 * @returns CSS variable value
 */
export function pickColor(key: string): string {
	let sum = 0;
	for (const ch of key)
		sum = (sum + ch.charCodeAt(0)) % ACCENT_VARIABLES.length;
	return getCssVariable(ACCENT_VARIABLES[sum]);
}

/**
 * Convert a hex color string to rgba with the given alpha.
 *
 * @param color - Hex color like `#ff0000` or rgb string
 * @param alpha - Alpha value between 0 and 1
 * @returns RGBA color string
 */
export function alphaColor(color: string, alpha: number): string {
	if (color.startsWith("#")) {
		let hex = color.slice(1);
		if (hex.length === 3)
			hex = hex
				.split("")
				.map((c) => c + c)
				.join("");
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}
	if (color.startsWith("rgba")) {
		const [r, g, b] = color
			.replace(/rgba\(|\)/g, "")
			.split(",")
			.slice(0, 3)
			.map((v) => Number(v.trim()));
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}
	if (color.startsWith("rgb")) {
		const [r, g, b] = color
			.replace(/rgb\(|\)/g, "")
			.split(",")
			.map((v) => Number(v.trim()));
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}
	return color;
}
