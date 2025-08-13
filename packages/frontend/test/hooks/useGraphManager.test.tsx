import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Theme } from "../../src/graph/graph-types.ts";
import { useGraphManager } from "../../src/hooks/useGraphManager.ts";
import { UiProvider } from "../../src/store/provider.tsx";

// Mock the graph-related modules
vi.mock("../../src/graph/graph.ts", () => ({
	drawGraph: vi.fn(),
	destroyGraph: vi.fn(),
}));

vi.mock("../../src/graph/graph-style.ts", () => ({
	applyNodeStyle: vi.fn(),
	highlightNeighborhood: vi.fn(),
	resetHighlight: vi.fn(),
}));

vi.mock("../../src/graph/node.ts", () => ({
	openNode: vi.fn(),
}));

// Create a wrapper for hooks that need UiProvider context
function createWrapper() {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <UiProvider>{children}</UiProvider>;
	};
}

describe("useGraphManager Hook", () => {
	let mockDrawGraph: ReturnType<typeof vi.fn>;
	let mockHighlightNeighborhood: ReturnType<typeof vi.fn>;
	let mockResetHighlight: ReturnType<typeof vi.fn>;
	let mockOpenNode: ReturnType<typeof vi.fn>;
	let mockGraphInstance: { type: string };

	const defaultProps = {
		theme: "light" as Theme,
		renderer: "cytoscape" as const,
		layout: "cose" as const,
		nodeSize: 10,
		labelScale: 1,
		showLabels: true,
		detailsOpen: false,
		selectedId: "",
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		// Get the mocked functions
		const graphModule = await import("../../src/graph/graph.ts");
		const styleModule = await import("../../src/graph/graph-style.ts");
		const nodeModule = await import("../../src/graph/node.ts");

		mockDrawGraph = graphModule.drawGraph as ReturnType<typeof vi.fn>;
		mockHighlightNeighborhood = styleModule.highlightNeighborhood as ReturnType<
			typeof vi.fn
		>;
		mockResetHighlight = styleModule.resetHighlight as ReturnType<typeof vi.fn>;
		mockOpenNode = nodeModule.openNode as ReturnType<typeof vi.fn>;

		// Create mock graph instance
		mockGraphInstance = {
			type: "cytoscape",
		};

		mockDrawGraph.mockResolvedValue(mockGraphInstance);
		mockOpenNode.mockResolvedValue({
			id: "test-node",
			title: "Test Node",
			body: "Test content",
		});
	});

	it("returns expected interface", () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});

		expect(result.current.graphRef).toBeDefined();
		expect(result.current.openNodeAction).toBeTypeOf("function");
		expect(result.current.highlightNode).toBeTypeOf("function");
		expect(result.current.resetNodeHighlight).toBeTypeOf("function");
	});

	it("openNodeAction calls openNode and dispatches actions", async () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.openNodeAction("test-id");
		});

		expect(mockOpenNode).toHaveBeenCalledWith("light", "test-id");
	});

	it("highlightNode calls highlightNeighborhood with current graph instance", () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});

		act(() => {
			result.current.highlightNode("test-id");
		});

		expect(mockHighlightNeighborhood).toHaveBeenCalledWith(
			undefined, // graph instance starts as undefined
			"test-id",
		);
	});

	it("resetNodeHighlight calls resetHighlight with current graph instance", () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});

		act(() => {
			result.current.resetNodeHighlight();
		});

		expect(mockResetHighlight).toHaveBeenCalledWith(undefined);
	});

	it("handles missing graph element gracefully", () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});

		// Graph ref starts as null, should not throw
		expect(result.current.graphRef.current).toBeNull();

		// These should not throw even with no graph instance
		expect(() => {
			result.current.highlightNode("test-id");
			result.current.resetNodeHighlight();
		}).not.toThrow();
	});

	it("updates theme in openNodeAction", async () => {
		const { result } = renderHook(
			() =>
				useGraphManager({
					...defaultProps,
					theme: "dark",
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			await result.current.openNodeAction("test-id");
		});

		expect(mockOpenNode).toHaveBeenCalledWith("dark", "test-id");
	});

	it("provides stable reference functions", () => {
		const { result, rerender } = renderHook((props) => useGraphManager(props), {
			wrapper: createWrapper(),
			initialProps: defaultProps,
		});

		const initialFunctions = {
			openNodeAction: result.current.openNodeAction,
			highlightNode: result.current.highlightNode,
			resetNodeHighlight: result.current.resetNodeHighlight,
		};

		rerender({
			...defaultProps,
			nodeSize: 20,
		});

		// Functions should remain stable across renders
		expect(result.current.openNodeAction).toBe(initialFunctions.openNodeAction);
		expect(result.current.highlightNode).toBe(initialFunctions.highlightNode);
		expect(result.current.resetNodeHighlight).toBe(
			initialFunctions.resetNodeHighlight,
		);
	});

	it("openNodeAction depends on theme and dispatch", async () => {
		const { result, rerender } = renderHook((props) => useGraphManager(props), {
			wrapper: createWrapper(),
			initialProps: defaultProps,
		});

		const initialOpenNodeAction = result.current.openNodeAction;

		// Theme change should create new openNodeAction function
		rerender({
			...defaultProps,
			theme: "dark",
		});

		expect(result.current.openNodeAction).not.toBe(initialOpenNodeAction);
	});

	it("highlight functions do not depend on props", () => {
		const { result, rerender } = renderHook((props) => useGraphManager(props), {
			wrapper: createWrapper(),
			initialProps: defaultProps,
		});

		const initialHighlightNode = result.current.highlightNode;
		const initialResetNodeHighlight = result.current.resetNodeHighlight;

		rerender({
			...defaultProps,
			theme: "dark",
			nodeSize: 20,
		});

		// Highlight functions should remain the same
		expect(result.current.highlightNode).toBe(initialHighlightNode);
		expect(result.current.resetNodeHighlight).toBe(initialResetNodeHighlight);
	});

	it("handles renderer-specific event binding patterns", () => {
		// Test that the hook can handle different renderer types
		const cytoscapeResult = renderHook(
			() =>
				useGraphManager({
					...defaultProps,
					renderer: "cytoscape" as const,
				}),
			{ wrapper: createWrapper() },
		);

		const forceGraphResult = renderHook(
			() =>
				useGraphManager({
					...defaultProps,
					renderer: "force-graph" as const,
				}),
			{ wrapper: createWrapper() },
		);

		// Both should return the same interface
		expect(cytoscapeResult.result.current).toHaveProperty("graphRef");
		expect(cytoscapeResult.result.current).toHaveProperty("openNodeAction");
		expect(forceGraphResult.result.current).toHaveProperty("graphRef");
		expect(forceGraphResult.result.current).toHaveProperty("openNodeAction");
	});
});
