import { describe, expect, it } from "vitest";
import { alphaColor } from "../src/style.ts";

describe("alphaColor", () => {
	it("converts hex colors", () => {
		expect(alphaColor("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
	});

	it("expands shorthand hex", () => {
		expect(alphaColor("#123", 0.75)).toBe("rgba(17, 34, 51, 0.75)");
	});

	it("handles rgb strings", () => {
		expect(alphaColor("rgb(10, 20, 30)", 0.3)).toBe("rgba(10, 20, 30, 0.3)");
	});

	it("handles rgba strings", () => {
		expect(alphaColor("rgba(10, 20, 30, 0.9)", 0.3)).toBe(
			"rgba(10, 20, 30, 0.3)",
		);
	});

	it("returns original for unknown format", () => {
		expect(alphaColor("blue", 0.1)).toBe("blue");
	});
});
