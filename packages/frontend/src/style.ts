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
