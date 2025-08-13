import type { Core } from "cytoscape";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	GraphInstance,
	GraphLink,
	GraphNode,
} from "../../src/graph/graph-types.ts";

// Mock style utilities
vi.mock("../../src/utils/style.ts", () => ({
	alphaColor: vi.fn(
		(color: string, alpha: number) => `rgba(${color}, ${alpha})`,
	),
}));

describe("Graph Style Module", () => {
	let graphStyleModule: typeof import("../../src/graph/graph-style.ts");
	let alphaColorMock: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.clearAllMocks();
		graphStyleModule = await import("../../src/graph/graph-style.ts");
		const styleUtils = await import("../../src/utils/style.ts");
		alphaColorMock = styleUtils.alphaColor as ReturnType<typeof vi.fn>;
	});

	describe("highlightNeighborhood", () => {
		it("does nothing when graph is undefined", () => {
			const { highlightNeighborhood } = graphStyleModule;

			expect(() => {
				highlightNeighborhood(undefined, "test-node");
			}).not.toThrow();
		});

		it("highlights Cytoscape graph neighborhood", () => {
			const { highlightNeighborhood } = graphStyleModule;

			const mockElement1 = {
				isNode: () => true,
				style: vi.fn(),
			};
			const mockElement2 = {
				isNode: () => false,
				style: vi.fn(),
			};
			const mockElement3 = {
				isNode: () => true,
				style: vi.fn(),
			};

			const mockNeighborhood = {
				has: vi.fn((el) => el === mockElement1 || el === mockElement2),
			};

			const mockFocus = {
				closedNeighborhood: vi.fn(() => mockNeighborhood),
			};

			const mockCytoscape = {
				$id: vi.fn(() => mockFocus),
				elements: vi.fn(() => ({
					forEach: vi.fn((callback) => {
						callback(mockElement1);
						callback(mockElement2);
						callback(mockElement3);
					}),
				})),
			};

			highlightNeighborhood(
				mockCytoscape as unknown as GraphInstance,
				"focus-node",
			);

			expect(mockCytoscape.$id).toHaveBeenCalledWith("focus-node");
			expect(mockElement1.style).toHaveBeenCalledWith("opacity", 1);
			expect(mockElement2.style).toHaveBeenCalledWith("opacity", 1);
			expect(mockElement3.style).toHaveBeenCalledWith("opacity", 0.15);
		});

		it("highlights Force Graph neighborhood", () => {
			const { highlightNeighborhood } = graphStyleModule;

			const mockNodes: GraphNode[] = [
				{ id: "node1", label: "Node 1", color: "#ff0000" },
				{ id: "node2", label: "Node 2", color: "#00ff00" },
				{ id: "node3", label: "Node 3", color: "#0000ff" },
			];

			const mockLinks: GraphLink[] = [
				{ source: "node1", target: "node2", color: "#cccccc" },
				{ source: "node2", target: "node3", color: "#cccccc" },
			];

			const mockForceGraph = {
				graphData: vi.fn(() => ({
					nodes: mockNodes,
					links: mockLinks,
				})),
				nodeColor: vi.fn(),
				linkColor: vi.fn(),
			};

			alphaColorMock.mockImplementation(
				(color: string, alpha: number) => `rgba(${color.slice(1)}, ${alpha})`,
			);

			highlightNeighborhood(
				mockForceGraph as unknown as GraphInstance,
				"node1",
			);

			expect(mockForceGraph.nodeColor).toHaveBeenCalled();
			expect(mockForceGraph.linkColor).toHaveBeenCalled();

			// Test nodeColor callback
			const nodeColorCallback = mockForceGraph.nodeColor.mock.calls[0]?.[0];
			expect(nodeColorCallback(mockNodes[0])).toBe("#ff0000"); // neighbor
			expect(nodeColorCallback(mockNodes[2])).toBe("rgba(0000ff, 0.15)"); // non-neighbor

			// Test linkColor callback
			const linkColorCallback = mockForceGraph.linkColor.mock.calls[0]?.[0];
			expect(linkColorCallback(mockLinks[0])).toBe("#cccccc"); // connected to focus
			expect(linkColorCallback(mockLinks[1])).toBe("rgba(cccccc, 0.05)"); // not connected to focus
		});

		it("handles Force Graph with object-type links", () => {
			const { highlightNeighborhood } = graphStyleModule;

			const mockNodes: GraphNode[] = [
				{ id: "node1", label: "Node 1", color: "#ff0000" },
				{ id: "node2", label: "Node 2", color: "#00ff00" },
			];

			const mockLinks: GraphLink[] = [
				{
					source: { id: "node1" } as GraphNode,
					target: { id: "node2" } as GraphNode,
					color: "#cccccc",
				},
			];

			const mockForceGraph = {
				graphData: vi.fn(() => ({
					nodes: mockNodes,
					links: mockLinks,
				})),
				nodeColor: vi.fn(),
				linkColor: vi.fn(),
			};

			highlightNeighborhood(
				mockForceGraph as unknown as GraphInstance,
				"node1",
			);

			// Test linkColor callback with object sources
			const linkColorCallback = mockForceGraph.linkColor.mock.calls[0]?.[0];
			expect(linkColorCallback(mockLinks[0])).toBe("#cccccc");
		});
	});

	describe("applyElementsStyle", () => {
		it("applies style to all elements", () => {
			const { applyElementsStyle } = graphStyleModule;

			const mockElements = {
				style: vi.fn(),
			};

			const mockGraph = {
				elements: vi.fn(() => mockElements),
			};

			const style = {
				color: "#ff0000",
				width: 10,
				opacity: 0.8,
			};

			applyElementsStyle(mockGraph as unknown as Core, style);

			expect(mockGraph.elements).toHaveBeenCalled();
			expect(mockElements.style).toHaveBeenCalledTimes(3);
			expect(mockElements.style).toHaveBeenCalledWith("color", "#ff0000");
			expect(mockElements.style).toHaveBeenCalledWith("width", 10);
			expect(mockElements.style).toHaveBeenCalledWith("opacity", 0.8);
		});

		it("does nothing when graph is undefined", () => {
			const { applyElementsStyle } = graphStyleModule;

			expect(() => {
				applyElementsStyle(undefined, { color: "#ff0000" });
			}).not.toThrow();
		});
	});

	describe("applyNodeStyle", () => {
		it("applies style to all nodes", () => {
			const { applyNodeStyle } = graphStyleModule;

			const mockNodes = {
				style: vi.fn(),
			};

			const mockGraph = {
				nodes: vi.fn(() => mockNodes),
			};

			const style = {
				width: 20,
				height: 20,
				"background-color": "#00ff00",
			};

			applyNodeStyle(mockGraph as unknown as Core, style);

			expect(mockGraph.nodes).toHaveBeenCalled();
			expect(mockNodes.style).toHaveBeenCalledWith(style);
		});

		it("does nothing when graph is undefined", () => {
			const { applyNodeStyle } = graphStyleModule;

			expect(() => {
				applyNodeStyle(undefined, { width: 20 });
			}).not.toThrow();
		});
	});

	describe("resetHighlight", () => {
		it("does nothing when graph is undefined", () => {
			const { resetHighlight } = graphStyleModule;

			expect(() => {
				resetHighlight(undefined);
			}).not.toThrow();
		});

		it("resets Cytoscape graph highlight", () => {
			const { resetHighlight } = graphStyleModule;

			const mockElements = {
				style: vi.fn(),
			};

			const mockCytoscape = {
				elements: vi.fn(() => mockElements),
			};

			resetHighlight(mockCytoscape as unknown as GraphInstance);

			expect(mockCytoscape.elements).toHaveBeenCalled();
			expect(mockElements.style).toHaveBeenCalledWith("opacity", 1);
		});

		it("resets Force Graph highlight", () => {
			const { resetHighlight } = graphStyleModule;

			const mockForceGraph = {
				nodeColor: vi.fn(),
				linkColor: vi.fn(),
			};

			resetHighlight(mockForceGraph as unknown as GraphInstance);

			expect(mockForceGraph.nodeColor).toHaveBeenCalledWith("color");
			expect(mockForceGraph.linkColor).toHaveBeenCalledWith("color");
		});
	});
});
