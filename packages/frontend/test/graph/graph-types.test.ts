import { describe, expect, test } from "vitest";
import {
	type GraphLink,
	type GraphNode,
	Layouts,
	Renderers,
	Themes,
} from "../../src/graph/graph-types.ts";

describe("Layouts", () => {
	test("contains expected layout values", () => {
		expect(Layouts).toContain("cose");
		expect(Layouts).toContain("grid");
		expect(Layouts).toContain("circle");
		expect(Layouts).toContain("concentric");
		expect(Layouts).toContain("random");
		expect(Layouts).toContain("breadthfirst");
	});

	test("has correct length", () => {
		expect(Layouts).toHaveLength(6);
	});
});

describe("Themes", () => {
	test("contains expected theme values", () => {
		const themeValues = Themes.map((t) => t.value);
		expect(themeValues).toContain("light");
		expect(themeValues).toContain("dark");
		expect(themeValues).toContain("nord-dark");
		expect(themeValues).toContain("gruvbox-dark");
		expect(themeValues).toContain("dracula-dark");
	});

	test("has labels for each theme", () => {
		Themes.forEach((theme) => {
			expect(theme).toHaveProperty("value");
			expect(theme).toHaveProperty("label");
			expect(typeof theme.value).toBe("string");
			expect(typeof theme.label).toBe("string");
		});
	});

	test("has correct length", () => {
		expect(Themes).toHaveLength(5);
	});
});

describe("Renderers", () => {
	test("contains expected renderer values", () => {
		const rendererValues = Renderers.map((r) => r.value);
		expect(rendererValues).toContain("cytoscape");
		expect(rendererValues).toContain("force-graph");
		expect(rendererValues).toContain("3d-force-graph");
	});

	test("has labels for each renderer", () => {
		Renderers.forEach((renderer) => {
			expect(renderer).toHaveProperty("value");
			expect(renderer).toHaveProperty("label");
			expect(typeof renderer.value).toBe("string");
			expect(typeof renderer.label).toBe("string");
		});
	});

	test("has correct length", () => {
		expect(Renderers).toHaveLength(3);
	});
});

describe("GraphNode interface", () => {
	test("has required properties", () => {
		const node: GraphNode = {
			id: "test-id",
			label: "Test Node",
			color: "#ff0000",
		};

		expect(node.id).toBe("test-id");
		expect(node.label).toBe("Test Node");
		expect(node.color).toBe("#ff0000");
	});
});

describe("GraphLink interface", () => {
	test("has required properties", () => {
		const sourceNode: GraphNode = {
			id: "source",
			label: "Source",
			color: "#00ff00",
		};

		const targetNode: GraphNode = {
			id: "target",
			label: "Target",
			color: "#0000ff",
		};

		const link: GraphLink = {
			source: sourceNode,
			target: targetNode,
			color: "#ff00ff",
		};

		expect(link.source).toBe(sourceNode);
		expect(link.target).toBe(targetNode);
		expect(link.color).toBe("#ff00ff");
	});
});
