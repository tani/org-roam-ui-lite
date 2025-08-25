import { describe, expect, it } from "vitest";
import {
	generateResponsiveCSS,
	previewPopoverCSS,
	RESPONSIVE_BREAKPOINTS,
	responsiveWidthCSS,
} from "../../src/utils/responsive.ts";

describe("Responsive Utilities", () => {
	describe("RESPONSIVE_BREAKPOINTS", () => {
		it("contains correct breakpoint values", () => {
			expect(RESPONSIVE_BREAKPOINTS.sm).toBe(576);
			expect(RESPONSIVE_BREAKPOINTS.md).toBe(768);
			expect(RESPONSIVE_BREAKPOINTS.lg).toBe(992);
			expect(RESPONSIVE_BREAKPOINTS.xl).toBe(1200);
		});

		it("is readonly object", () => {
			// TypeScript prevents modification at compile time
			// Just verify the object has the expected properties
			expect(RESPONSIVE_BREAKPOINTS).toHaveProperty("sm");
			expect(RESPONSIVE_BREAKPOINTS).toHaveProperty("md");
			expect(RESPONSIVE_BREAKPOINTS).toHaveProperty("lg");
			expect(RESPONSIVE_BREAKPOINTS).toHaveProperty("xl");
		});
	});

	describe("responsiveWidthCSS", () => {
		it("contains base responsive-wide class", () => {
			expect(responsiveWidthCSS).toContain(
				".responsive-wide.offcanvas.offcanvas-end {",
			);
			expect(responsiveWidthCSS).toContain("width: 90vw;");
		});

		it("contains all breakpoint media queries", () => {
			expect(responsiveWidthCSS).toContain("@media (min-width: 576px)");
			expect(responsiveWidthCSS).toContain("@media (min-width: 768px)");
			expect(responsiveWidthCSS).toContain("@media (min-width: 992px)");
			expect(responsiveWidthCSS).toContain("@media (min-width: 1200px)");
		});

		it("contains responsive width values", () => {
			expect(responsiveWidthCSS).toContain("width: 85vw;");
			expect(responsiveWidthCSS).toContain("width: 70vw;");
			expect(responsiveWidthCSS).toContain("width: 60vw;");
			expect(responsiveWidthCSS).toContain("width: 50vw;");
		});

		it("contains max-width for largest breakpoint", () => {
			expect(responsiveWidthCSS).toContain("max-width: 800px;");
		});
	});

	describe("previewPopoverCSS", () => {
		it("contains base preview-popover class", () => {
			expect(previewPopoverCSS).toContain(".preview-popover {");
			expect(previewPopoverCSS).toContain("position: fixed;");
			expect(previewPopoverCSS).toContain("z-index: 1070;");
			expect(previewPopoverCSS).toContain("max-height: 75vh;");
			expect(previewPopoverCSS).toContain("overflow: auto;");
		});

		it("contains all breakpoint media queries", () => {
			expect(previewPopoverCSS).toContain("@media (min-width: 576px)");
			expect(previewPopoverCSS).toContain("@media (min-width: 768px)");
			expect(previewPopoverCSS).toContain("@media (min-width: 992px)");
			expect(previewPopoverCSS).toContain("@media (min-width: 1200px)");
		});

		it("contains complex width calculations", () => {
			expect(previewPopoverCSS).toContain(
				"width: min(calc(100% - 85vw), 85vw);",
			);
			expect(previewPopoverCSS).toContain(
				"width: min(calc(100% - 70vw), 70vw);",
			);
			expect(previewPopoverCSS).toContain(
				"width: min(calc(100% - 60vw), 60vw);",
			);
			expect(previewPopoverCSS).toContain(
				"width: min(calc(100% - 50vw), 50vw);",
			);
		});

		it("contains max-width for largest breakpoint", () => {
			expect(previewPopoverCSS).toContain("max-width: 800px;");
		});
	});

	describe("generateResponsiveCSS", () => {
		it("combines both CSS strings", () => {
			const result = generateResponsiveCSS();
			expect(result).toContain(responsiveWidthCSS);
			expect(result).toContain(previewPopoverCSS);
		});

		it("separates CSS blocks with double newlines", () => {
			const result = generateResponsiveCSS();
			expect(result).toContain("\n\n");
		});

		it("produces valid CSS structure", () => {
			const result = generateResponsiveCSS();

			// Check for proper CSS structure
			expect(result).toMatch(
				/\.responsive-wide\.offcanvas\.offcanvas-end\s*\{[\s\S]*?\}/,
			);
			expect(result).toMatch(/\.preview-popover\s*\{[\s\S]*?\}/);
			expect(result).toMatch(/@media\s*\([^)]+\)\s*\{[\s\S]*?\}/);
		});

		it("includes all expected selectors", () => {
			const result = generateResponsiveCSS();

			expect(result).toContain(".responsive-wide");
			expect(result).toContain(".preview-popover");

			// Count media queries (should be 8 total: 4 for each CSS block)
			const mediaQueries = result.match(/@media/g);
			expect(mediaQueries).toHaveLength(8);
		});
	});
});
