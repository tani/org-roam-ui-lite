import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	GraphInstance,
	GraphLink,
	GraphNode,
} from "../src/graph-types.ts";
import renderForceGraph from "../src/renderers/force-graph.ts";

const ctorMock = vi.fn();
let lastInstance: GraphInstance & Record<string, unknown>;

function createInstance(): GraphInstance & Record<string, unknown> {
	const inst = {
		nodeId: vi.fn(() => inst),
		nodeLabel: vi.fn(() => inst),
		nodeColor: vi.fn(() => inst),
		nodeVal: vi.fn(() => inst),
		nodeRelSize: vi.fn(() => inst),
		linkColor: vi.fn(() => inst),
		linkWidth: vi.fn(() => inst),
		graphData: vi.fn(() => inst),
		nodeCanvasObject: vi.fn(() => inst),
		nodeCanvasObjectMode: vi.fn(() => inst),
	} as unknown as GraphInstance & Record<string, unknown>;
	return inst;
}

vi.mock("force-graph", () => ({
	default: class {
		constructor(...args: unknown[]) {
			ctorMock(...args);
			lastInstance = createInstance();
			Object.assign(this, lastInstance);
		}
	},
}));

beforeEach(() => {
	ctorMock.mockClear();
	if (lastInstance) {
		(Object.values(lastInstance) as Array<unknown>).forEach((v) => {
			if (typeof v === "function")
				(v as { mockClear?: () => void }).mockClear?.();
		});
	}
	document.documentElement.style.setProperty("--bs-font-sans-serif", "sans");
	document.documentElement.style.setProperty("--bs-body-color", "black");
});

describe("renderForceGraph", () => {
	it("creates a new instance and draws nodes", async () => {
		const nodes: GraphNode[] = [{ id: "1", label: "A", color: "red" }];
		const edges: GraphLink[] = [
			{ source: "1", target: "1", color: "red" } as GraphLink,
		];
		const container = document.createElement("div");
		const result = await renderForceGraph(
			nodes,
			edges,
			"cose",
			container,
			undefined,
			10,
			1,
			true,
		);
		expect(result).toEqual(lastInstance);
		expect(ctorMock).toHaveBeenCalledWith(container);
		const area = Math.PI * 25;
		expect(lastInstance.graphData).toHaveBeenCalledWith({
			nodes: [{ ...nodes[0], val: area }],
			links: edges,
		});
		const cb = (
			lastInstance.nodeCanvasObject as unknown as {
				mock: { calls: unknown[][] };
			}
		).mock.calls[0][0] as (
			n: GraphNode,
			c: CanvasRenderingContext2D,
			s: number,
		) => void;
		const ctx = {
			font: "",
			textAlign: "",
			textBaseline: "",
			fillStyle: "",
			fillText: vi.fn(),
		} as unknown as CanvasRenderingContext2D;
		cb({ label: "A", x: 1, y: 2 } as GraphNode, ctx, 2);
		expect(ctx.fillText).toHaveBeenCalledWith("A", 1, 2 + 5 + 2);
		expect(ctx.font).toBe("18px sans");
	});

	it("updates existing instance", async () => {
		const existing = createInstance();
		const container = document.createElement("div");
		const result = await renderForceGraph(
			[],
			[],
			"cose",
			container,
			existing,
			10,
			1,
			true,
		);
		expect(result).toBe(existing);
		expect(ctorMock).not.toHaveBeenCalled();
		expect(existing.graphData).toHaveBeenCalled();
	});

	it("disables labels when requested", async () => {
		const nodes: GraphNode[] = [{ id: "1", label: "A", color: "red" }];
		const container = document.createElement("div");
		await renderForceGraph(
			nodes,
			[],
			"cose",
			container,
			undefined,
			10,
			1,
			false,
		);
		const cb = (
			lastInstance.nodeCanvasObject as unknown as {
				mock: { calls: unknown[][] };
			}
		).mock.calls[0][0] as (
			n: GraphNode,
			c: CanvasRenderingContext2D,
			s: number,
		) => void;
		const ctx = { fillText: vi.fn() } as unknown as CanvasRenderingContext2D;
		cb({ label: "A", x: 0, y: 0 } as GraphNode, ctx, 1);
		expect(ctx.fillText).not.toHaveBeenCalled();
	});
});
