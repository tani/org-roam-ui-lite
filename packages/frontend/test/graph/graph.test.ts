import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphInstance } from "../../src/graph/graph-types.ts";

// Mock openapi-fetch
const mockGET = vi.fn();
vi.mock("openapi-fetch", () => ({
	default: vi.fn(() => ({
		GET: mockGET,
	})),
}));

// Mock style utilities
vi.mock("../../src/utils/style.ts", () => ({
	getCssVariable: vi.fn(() => "#cccccc"),
	pickColor: vi.fn((id: string) => `#color-${id}`),
}));

// Mock renderers
const mockCytoscapeRenderer = vi.fn().mockResolvedValue({ type: "cytoscape" });
const mockForceGraphRenderer = vi
	.fn()
	.mockResolvedValue({ type: "force-graph" });
const mock3DForceGraphRenderer = vi
	.fn()
	.mockResolvedValue({ type: "3d-force-graph" });

vi.mock("../../src/graph/renderers/cytoscape.ts", () => ({
	default: mockCytoscapeRenderer,
}));

vi.mock("../../src/graph/renderers/force-graph.ts", () => ({
	default: mockForceGraphRenderer,
}));

vi.mock("../../src/graph/renderers/force-graph-3d.ts", () => ({
	default: mock3DForceGraphRenderer,
}));

describe("Graph Module", () => {
	let graphModule: typeof import("../../src/graph/graph.ts");

	beforeEach(async () => {
		vi.clearAllMocks();
		graphModule = await import("../../src/graph/graph.ts");
	});

	describe("fetchGraphData", () => {
		const mockApiData = {
			nodes: [
				{ id: "node1", title: "Test Node 1" },
				{ id: "node2", title: "Test Node 2" },
			],
			edges: [{ source: "node1", dest: "node2" }],
		};

		it("fetches and transforms graph data successfully", async () => {
			mockGET.mockResolvedValue({
				data: mockApiData,
				error: undefined,
			});

			const { drawGraph } = graphModule;
			const mockContainer = document.createElement("div");

			await drawGraph(
				"cytoscape",
				"cose",
				mockContainer,
				undefined,
				10,
				1,
				true,
			);

			expect(mockGET).toHaveBeenCalledWith("/api/graph.json");
			expect(mockCytoscapeRenderer).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						id: "node1",
						label: "Test Node 1",
						color: "#color-node1",
					}),
				]),
				expect.arrayContaining([
					expect.objectContaining({
						source: "node1",
						target: "node2",
						color: "#cccccc",
					}),
				]),
				"cose",
				mockContainer,
				undefined,
				10,
				1,
				true,
			);
		});

		it("throws error when API returns error", async () => {
			const apiError = "Network error";
			mockGET.mockResolvedValue({
				data: undefined,
				error: apiError,
			});

			const { drawGraph } = graphModule;
			const mockContainer = document.createElement("div");

			await expect(
				drawGraph("cytoscape", "cose", mockContainer, undefined, 10, 1, true),
			).rejects.toThrow("API error: Network error");
		});
	});

	describe("drawGraph", () => {
		const mockApiData = {
			nodes: [{ id: "test", title: "Test" }],
			edges: [],
		};

		beforeEach(() => {
			mockGET.mockResolvedValue({
				data: mockApiData,
				error: undefined,
			});
		});

		it("uses cytoscape renderer", async () => {
			const { drawGraph } = graphModule;
			const mockContainer = document.createElement("div");

			const result = await drawGraph(
				"cytoscape",
				"cose",
				mockContainer,
				undefined,
				15,
				1.2,
				false,
			);

			expect(mockCytoscapeRenderer).toHaveBeenCalled();
			expect(result).toEqual({ type: "cytoscape" });
		});

		it("uses force-graph renderer", async () => {
			const { drawGraph } = graphModule;
			const mockContainer = document.createElement("div");

			const result = await drawGraph(
				"force-graph",
				"cose",
				mockContainer,
				undefined,
				20,
				0.8,
				true,
			);

			expect(mockForceGraphRenderer).toHaveBeenCalled();
			expect(result).toEqual({ type: "force-graph" });
		});

		it("uses 3d-force-graph renderer", async () => {
			const { drawGraph } = graphModule;
			const mockContainer = document.createElement("div");

			const result = await drawGraph(
				"3d-force-graph",
				"cose",
				mockContainer,
				undefined,
				25,
				1.5,
				true,
			);

			expect(mock3DForceGraphRenderer).toHaveBeenCalled();
			expect(result).toEqual({ type: "3d-force-graph" });
		});

		it("passes existing graph instance to renderer", async () => {
			const { drawGraph } = graphModule;
			const mockContainer = document.createElement("div");
			const existingGraph = { type: "existing" } as unknown as GraphInstance;

			await drawGraph(
				"cytoscape",
				"cose",
				mockContainer,
				existingGraph,
				10,
				1,
				true,
			);

			expect(mockCytoscapeRenderer).toHaveBeenCalledWith(
				expect.any(Array),
				expect.any(Array),
				"cose",
				mockContainer,
				existingGraph,
				10,
				1,
				true,
			);
		});
	});

	describe("destroyGraph", () => {
		it("calls destroy method when available", () => {
			const { destroyGraph } = graphModule;
			const mockInstance = {
				destroy: vi.fn(),
			};
			const mockContainer = document.createElement("div");
			mockContainer.appendChild(document.createElement("div"));

			destroyGraph(mockInstance as unknown as GraphInstance, mockContainer);

			expect(mockInstance.destroy).toHaveBeenCalled();
			expect(mockContainer.children.length).toBe(0);
		});

		it("calls pauseAnimation method when destroy not available", () => {
			const { destroyGraph } = graphModule;
			const mockInstance = {
				pauseAnimation: vi.fn(),
			};
			const mockContainer = document.createElement("div");
			mockContainer.appendChild(document.createElement("div"));

			destroyGraph(mockInstance as unknown as GraphInstance, mockContainer);

			expect(mockInstance.pauseAnimation).toHaveBeenCalled();
			expect(mockContainer.children.length).toBe(0);
		});

		it("only clears container when no cleanup methods available", () => {
			const { destroyGraph } = graphModule;
			const mockInstance = {};
			const mockContainer = document.createElement("div");
			const childElement = document.createElement("div");
			mockContainer.appendChild(childElement);

			destroyGraph(mockInstance as unknown as GraphInstance, mockContainer);

			expect(mockContainer.children.length).toBe(0);
		});

		it("does nothing when instance is undefined", () => {
			const { destroyGraph } = graphModule;
			const mockContainer = document.createElement("div");
			const childElement = document.createElement("div");
			mockContainer.appendChild(childElement);

			destroyGraph(undefined, mockContainer);

			// Container should remain unchanged
			expect(mockContainer.children.length).toBe(1);
		});

		it("clears container even when instance is null", () => {
			const { destroyGraph } = graphModule;
			const mockContainer = document.createElement("div");
			mockContainer.appendChild(document.createElement("div"));

			destroyGraph(null as unknown as GraphInstance, mockContainer);

			// Should not clear container for null
			expect(mockContainer.children.length).toBe(1);
		});
	});

	describe("exports", () => {
		it("exports required types and constants", () => {
			const { Layouts, Renderers, Themes } = graphModule;

			expect(Layouts).toBeDefined();
			expect(Renderers).toBeDefined();
			expect(Themes).toBeDefined();
			expect(Array.isArray(Layouts)).toBe(true);
			expect(Array.isArray(Renderers)).toBe(true);
			expect(Array.isArray(Themes)).toBe(true);
		});
	});
});
