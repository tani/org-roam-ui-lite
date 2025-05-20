import type { Core } from "cytoscape";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getCssVar,
	pickColor,
	setElementsStyle,
	setNodeStyle,
} from "../src/app.ts";

const ACCENT_VARS = [
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

beforeEach(() => {
	// reset styles before each test
	const style = document.documentElement.style;
	for (const name of ACCENT_VARS) style.removeProperty(name);
	style.removeProperty("--foo");
});

describe("getCssVar", () => {
	it("returns trimmed css variable", () => {
		document.documentElement.style.setProperty("--foo", "  bar  ");
		expect(getCssVar("--foo")).toBe("bar");
	});
});

describe("pickColor", () => {
	beforeEach(() => {
		ACCENT_VARS.forEach((name) => {
			document.documentElement.style.setProperty(
				name,
				name.replace("--bs-", ""),
			);
		});
	});

	it("picks deterministic color", () => {
		expect(pickColor("abc")).toBe("red");
		expect(pickColor("")).toBe("blue");
	});
});

describe("setElementsStyle", () => {
	it("applies each style pair", () => {
		const mockStyle = vi.fn();
		const graph = {
			elements: vi.fn(() => ({ style: mockStyle })),
		} as unknown as Core;
		setElementsStyle(graph, { width: 2, color: "red" });
		expect(mockStyle).toHaveBeenNthCalledWith(1, "width", 2);
		expect(mockStyle).toHaveBeenNthCalledWith(2, "color", "red");
	});

	it("handles undefined graph", () => {
		expect(() => setElementsStyle(undefined, { foo: 1 })).not.toThrow();
	});
});

describe("setNodeStyle", () => {
	it("applies style to nodes", () => {
		const mockStyle = vi.fn();
		const graph = {
			nodes: vi.fn(() => ({ style: mockStyle })),
		} as unknown as Core;
		setNodeStyle(graph, { opacity: 0.5 });
		expect(mockStyle).toHaveBeenCalledWith({ opacity: 0.5 });
	});

	it("handles undefined graph", () => {
		expect(() => setNodeStyle(undefined, { foo: 1 })).not.toThrow();
	});
});
