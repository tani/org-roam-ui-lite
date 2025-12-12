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

	const attachGraph = async (result: ReturnType<typeof renderHook>) => {
		const div = document.createElement("div");
		await act(async () => {
			result.current.graphRef(div);
			await Promise.resolve();
		});
		return div;
	};

	it("returns expected interface", () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});

		expect(result.current.graphRef).toBeDefined();
		expect(result.current.openNodeAction).toBeTypeOf("function");
		expect(result.current.highlightNode).toBeTypeOf("function");
		expect(result.current.resetNodeHighlight).toBeTypeOf("function");
		expect(result.current.setRenderer).toBeTypeOf("function");
		expect(result.current.setLayout).toBeTypeOf("function");
		expect(result.current.setNodeSize).toBeTypeOf("function");
		expect(result.current.setLabelScale).toBeTypeOf("function");
		expect(result.current.setShowLabels).toBeTypeOf("function");
		expect(result.current.setTheme).toBeTypeOf("function");
	});

	it("openNodeAction uses the latest theme from setTheme", async () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});

		act(() => {
			result.current.setTheme("dark");
		});

		await act(async () => {
			await result.current.openNodeAction("test-id");
		});

		expect(mockOpenNode).toHaveBeenCalledWith("dark", "test-id");
	});

	it("highlight and reset helpers forward to graph style helpers", () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});

		act(() => {
			result.current.highlightNode("test-id");
			result.current.resetNodeHighlight();
		});

		expect(mockHighlightNeighborhood).toHaveBeenCalledWith(
			undefined,
			"test-id",
		);
		expect(mockResetHighlight).toHaveBeenCalledWith(undefined);
	});

	it("applies node size updates for cytoscape renderer", async () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});
		await attachGraph(result);

		await act(async () => {
			await result.current.setNodeSize(15);
		});

		const { applyNodeStyle } = await import("../../src/graph/graph-style.ts");
		expect(applyNodeStyle).toHaveBeenCalledWith(mockGraphInstance, {
			width: 15,
			height: 15,
		});
	});

	it("refreshes the graph when renderer changes", async () => {
		const { result } = renderHook(() => useGraphManager(defaultProps), {
			wrapper: createWrapper(),
		});
		await attachGraph(result);
		mockDrawGraph.mockClear();

		await act(async () => {
			await result.current.setRenderer("force-graph");
		});

		expect(mockDrawGraph).toHaveBeenCalled();
	});

	it("provides stable reference functions across rerenders", () => {
		const { result, rerender } = renderHook((props) => useGraphManager(props), {
			wrapper: createWrapper(),
			initialProps: defaultProps,
		});

		const initialFunctions = { ...result.current };

		rerender({
			...defaultProps,
			nodeSize: 20,
		});

		expect(result.current.openNodeAction).toBe(
			initialFunctions.openNodeAction,
		);
		expect(result.current.highlightNode).toBe(initialFunctions.highlightNode);
		expect(result.current.resetNodeHighlight).toBe(
			initialFunctions.resetNodeHighlight,
		);
		expect(result.current.setNodeSize).toBe(initialFunctions.setNodeSize);
		expect(result.current.setRenderer).toBe(initialFunctions.setRenderer);
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
