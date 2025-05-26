import { beforeEach, describe, expect, it, vi } from "vitest";

let mockGet: ReturnType<typeof vi.fn>;
vi.mock("openapi-fetch", () => ({
	default: vi.fn(() => ({ GET: (...args: unknown[]) => mockGet(...args) })),
}));

let mockCytoscape: ReturnType<typeof vi.fn>;
vi.mock("cytoscape", () => ({
	default: (...args: unknown[]) => mockCytoscape(...args),
}));

let mockForceGraph: ReturnType<typeof vi.fn>;
vi.mock("force-graph", () => ({
	default: class {
		constructor(...args: unknown[]) {
			Object.assign(this, mockForceGraph(...args));
		}
	},
}));

let mockForceGraph3D: ReturnType<typeof vi.fn>;
vi.mock("3d-force-graph", () => ({
	default: class {
		constructor(...args: unknown[]) {
			Object.assign(this, mockForceGraph3D(...args));
		}
	},
}));

vi.mock("../src/processor.ts", () => ({
	createOrgHtmlProcessor: vi.fn(
		() => (str: string) => Promise.resolve(`html:${str}`),
	),
}));

import { drawGraph, highlightNeighborhood } from "../src/graph.ts";
import { openNode } from "../src/node.ts";

const NODE_ID = "11111111-1111-4111-8111-111111111111";

mockGet = vi.fn();
mockCytoscape = vi.fn();
mockForceGraph = vi.fn();
mockForceGraph3D = vi.fn();

describe("highlightNeighborhood", () => {
	it("sets opacity based on neighborhood", () => {
		const node1 = { isNode: () => true, style: vi.fn() };
		const node2 = { isNode: () => true, style: vi.fn() };
		const edge = { isNode: () => false, style: vi.fn() };
		const focus = { closedNeighborhood: vi.fn(() => new Set([node1, edge])) };
		const graph = {
			$id: vi.fn(() => focus),
			elements: vi.fn(() => [node1, node2, edge]),
		} as unknown as import("cytoscape").Core;
		highlightNeighborhood(graph, "id");
		expect(node1.style).toHaveBeenCalledWith("opacity", 1);
		expect(edge.style).toHaveBeenCalledWith("opacity", 1);
		expect(node2.style).toHaveBeenCalledWith("opacity", 0.15);
	});

	it("handles undefined graph", () => {
		expect(() => highlightNeighborhood(undefined, "id")).not.toThrow();
	});
});

describe("drawGraph", () => {
	const container = document.createElement("div");
	beforeEach(() => {
		mockCytoscape.mockReset();
		mockForceGraph.mockReset();
		mockForceGraph3D.mockReset();
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
		const result = await drawGraph(
			"cytoscape",
			"cose",
			container,
			undefined,
			10,
			1,
			true,
		);
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
		const result = await drawGraph(
			"cytoscape",
			"fcose",
			container,
			existing,
			5,
			1,
			true,
		);
		expect(existing.batch).toHaveBeenCalled();
		expect(result).toBe(existing);
	});

	it("creates force-graph instance", async () => {
		const fgInstance = {
			graphData: vi.fn(),
			nodeId: vi.fn(() => fgInstance),
			nodeLabel: vi.fn(() => fgInstance),
			nodeColor: vi.fn(() => fgInstance),
			nodeVal: vi.fn(() => fgInstance),
			nodeRelSize: vi.fn(() => fgInstance),
			linkColor: vi.fn(() => fgInstance),
			linkWidth: vi.fn(() => fgInstance),
			nodeCanvasObject: vi.fn(() => fgInstance),
			nodeCanvasObjectMode: vi.fn(() => fgInstance),
		};
		mockForceGraph.mockReturnValue(fgInstance);
		mockGet.mockResolvedValue({ data: { nodes: [], edges: [] } });
		const result = await drawGraph(
			"force-graph",
			"cose",
			container,
			undefined,
			5,
			1,
			true,
		);
		expect(mockForceGraph).toHaveBeenCalledWith(container);
		expect(result).toEqual(fgInstance);
	});

	it("creates 3d-force-graph instance", async () => {
		const fgInstance = {
			graphData: vi.fn(),
			nodeId: vi.fn(() => fgInstance),
			nodeLabel: vi.fn(() => fgInstance),
			nodeColor: vi.fn(() => fgInstance),
			nodeVal: vi.fn(() => fgInstance),
			nodeRelSize: vi.fn(() => fgInstance),
			linkColor: vi.fn(() => fgInstance),
			linkWidth: vi.fn(() => fgInstance),
			backgroundColor: vi.fn(() => fgInstance),
			nodeThreeObject: vi.fn(() => fgInstance),
			nodeThreeObjectExtend: vi.fn(() => fgInstance),
		} as unknown as Record<string, unknown>;
		mockForceGraph3D.mockReturnValue(fgInstance);
		mockGet.mockResolvedValue({ data: { nodes: [], edges: [] } });
		const result = await drawGraph(
			"3d-force-graph",
			"cose",
			container,
			undefined,
			5,
			1,
			true,
		);
		expect(mockForceGraph3D).toHaveBeenCalledWith(container);
		expect(fgInstance.backgroundColor).toHaveBeenCalled();
		expect(result).toEqual(fgInstance);
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
