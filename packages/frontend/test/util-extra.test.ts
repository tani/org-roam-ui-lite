import { beforeEach, describe, expect, it, vi } from "vitest";

let mockGet: ReturnType<typeof vi.fn>;
vi.mock("openapi-fetch", () => ({
	default: vi.fn(() => ({ GET: (...args: unknown[]) => mockGet(...args) })),
}));

let mockCytoscape: ReturnType<typeof vi.fn>;
vi.mock("cytoscape", () => ({
	default: (...args: unknown[]) => mockCytoscape(...args),
}));

vi.mock("../src/processor.ts", () => ({
	createOrgHtmlProcessor: vi.fn(
		() => (str: string) => Promise.resolve(`html:${str}`),
	),
}));

import { dimOthers, renderGraph } from "../src/graph.ts";
import { openNode } from "../src/node.ts";

const NODE_ID = "11111111-1111-4111-8111-111111111111";

mockGet = vi.fn();
mockCytoscape = vi.fn();

describe("dimOthers", () => {
	it("sets opacity based on neighborhood", () => {
		const node1 = { isNode: () => true, style: vi.fn() };
		const node2 = { isNode: () => true, style: vi.fn() };
		const edge = { isNode: () => false, style: vi.fn() };
		const focus = { closedNeighborhood: vi.fn(() => new Set([node1, edge])) };
		const graph = {
			$id: vi.fn(() => focus),
			elements: vi.fn(() => [node1, node2, edge]),
		} as unknown as import("cytoscape").Core;
		dimOthers(graph, "id");
		expect(node1.style).toHaveBeenCalledWith("opacity", 1);
		expect(edge.style).toHaveBeenCalledWith("opacity", 1);
		expect(node2.style).toHaveBeenCalledWith("opacity", 0.15);
	});

	it("handles undefined graph", () => {
		expect(() => dimOthers(undefined, "id")).not.toThrow();
	});
});

describe("renderGraph", () => {
	const container = document.createElement("div");
	beforeEach(() => {
		mockCytoscape.mockReset();
		mockGet.mockReset();
	});

	it("creates new graph when none exists", async () => {
		const cyInstance = {};
		mockCytoscape.mockReturnValue(cyInstance);
		mockGet.mockResolvedValue({
			data: {
				nodes: [{ id: NODE_ID, title: "Node" }],
				edges: [],
			},
		});
		const result = await renderGraph("cose", container, undefined, 10, 1);
		expect(mockCytoscape).toHaveBeenCalled();
		expect(result).toBe(cyInstance);
	});

	it("updates existing graph", async () => {
		const existing = {
			batch: vi.fn((cb: () => void) => cb()),
			elements: vi.fn(() => ({ remove: vi.fn() })),
			add: vi.fn(),
			style: vi.fn(),
			layout: vi.fn(() => ({ run: vi.fn() })),
		} as unknown as import("cytoscape").Core;
		mockGet.mockResolvedValue({
			data: {
				nodes: [],
				edges: [],
			},
		});
		const result = await renderGraph("fcose", container, existing, 5, 1);
		expect(existing.batch).toHaveBeenCalled();
		expect(result).toBe(existing);
	});
});

describe("openNode", () => {
	beforeEach(() => {
		mockGet.mockReset();
	});

	it("fetches and processes node", async () => {
		mockGet.mockResolvedValue({
			data: { id: NODE_ID, title: "t", raw: "body" },
		});
		const result = await openNode("light", NODE_ID);
		expect(result.html).toBe("html:body");
		expect(result.id).toBe(NODE_ID);
	});

	it("throws on api error", async () => {
		mockGet.mockResolvedValue({ data: {}, error: "oops" });
		await expect(openNode("light", NODE_ID)).rejects.toBe("oops");
	});
});
