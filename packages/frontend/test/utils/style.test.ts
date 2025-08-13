import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	alphaColor,
	getCssVariable,
	pickColor,
} from "../../src/utils/style.ts";

describe("getCssVariable", () => {
	beforeEach(() => {
		// Mock getComputedStyle
		const mockGetComputedStyle = vi.fn(() => ({
			getPropertyValue: vi.fn((prop: string) => {
				const values: Record<string, string> = {
					"--bs-blue": "#0d6efd",
					"--bs-red": "#dc3545",
					"--bs-green": "#198754",
					"--test-var": "  test-value  ",
				};
				return values[prop] || "";
			}),
		}));
		vi.stubGlobal("getComputedStyle", mockGetComputedStyle);
	});

	test("gets CSS variable value", () => {
		const result = getCssVariable("--bs-blue");
		expect(result).toBe("#0d6efd");
	});

	test("trims whitespace from variable value", () => {
		const result = getCssVariable("--test-var");
		expect(result).toBe("test-value");
	});

	test("returns empty string for unknown variable", () => {
		const result = getCssVariable("--unknown-var");
		expect(result).toBe("");
	});
});

describe("pickColor", () => {
	beforeEach(() => {
		const mockGetComputedStyle = vi.fn(() => ({
			getPropertyValue: vi.fn((prop: string) => {
				const values: Record<string, string> = {
					"--bs-blue": "#0d6efd",
					"--bs-indigo": "#6610f2",
					"--bs-purple": "#6f42c1",
					"--bs-pink": "#d63384",
					"--bs-red": "#dc3545",
					"--bs-orange": "#fd7e14",
					"--bs-yellow": "#ffc107",
					"--bs-green": "#198754",
					"--bs-teal": "#20c997",
					"--bs-cyan": "#0dcaf0",
					"--bs-primary": "#007bff",
				};
				return values[prop] || "";
			}),
		}));
		vi.stubGlobal("getComputedStyle", mockGetComputedStyle);
	});

	test("returns consistent color for same key", () => {
		const color1 = pickColor("test");
		const color2 = pickColor("test");
		expect(color1).toBe(color2);
	});

	test("returns different colors for different keys", () => {
		const color1 = pickColor("key1");
		const color2 = pickColor("key2");
		expect(color1).not.toBe(color2);
	});

	test("returns valid color for empty string", () => {
		const color = pickColor("");
		expect(color).toBeTruthy();
	});

	test("returns valid color for various string lengths", () => {
		const colors = ["a", "ab", "abc", "abcdef", "very-long-key-name"].map(
			(key) => pickColor(key),
		);

		colors.forEach((color) => {
			expect(color).toBeTruthy();
			expect(color.startsWith("#")).toBe(true);
		});
	});
});

describe("alphaColor", () => {
	test("converts 6-digit hex to rgba", () => {
		const result = alphaColor("#ff0000", 0.5);
		expect(result).toBe("rgba(255, 0, 0, 0.5)");
	});

	test("converts 3-digit hex to rgba", () => {
		const result = alphaColor("#f00", 0.8);
		expect(result).toBe("rgba(255, 0, 0, 0.8)");
	});

	test("handles rgb color input", () => {
		const result = alphaColor("rgb(255, 0, 0)", 0.3);
		expect(result).toBe("rgba(255, 0, 0, 0.3)");
	});

	test("handles rgba color input", () => {
		const result = alphaColor("rgba(255, 0, 0, 1)", 0.7);
		expect(result).toBe("rgba(255, 0, 0, 0.7)");
	});

	test("handles rgba with whitespace", () => {
		const result = alphaColor("rgba( 255 , 128 , 64 , 1 )", 0.4);
		expect(result).toBe("rgba(255, 128, 64, 0.4)");
	});

	test("returns original color for unrecognized format", () => {
		const result = alphaColor("blue", 0.5);
		expect(result).toBe("blue");
	});

	test("handles edge alpha values", () => {
		expect(alphaColor("#ff0000", 0)).toBe("rgba(255, 0, 0, 0)");
		expect(alphaColor("#ff0000", 1)).toBe("rgba(255, 0, 0, 1)");
	});

	test("converts various hex colors correctly", () => {
		expect(alphaColor("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
		expect(alphaColor("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
		expect(alphaColor("#123456", 0.5)).toBe("rgba(18, 52, 86, 0.5)");
	});
});
