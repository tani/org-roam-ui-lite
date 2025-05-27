import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
vi.mock("openapi-fetch", () => ({
  default: vi.fn(() => ({ GET: (...args: unknown[]) => mockGet(...args) })),
}));

const mockCytoscape = vi.fn();
vi.mock("cytoscape", () => ({
  default: (...args: unknown[]) => mockCytoscape(...args),
}));

const mockForceGraph = vi.fn();
vi.mock("force-graph", () => ({
  default: class {
    constructor(...args: unknown[]) {
      Object.assign(this, mockForceGraph(...args));
    }
  },
}));

const mockForceGraph3D = vi.fn();
vi.mock("3d-force-graph", () => ({
  default: class {
    constructor(...args: unknown[]) {
      Object.assign(this, mockForceGraph3D(...args));
    }
  },
}));

vi.mock("../src/utils/processor.ts", () => ({
  createOrgHtmlProcessor: vi.fn(() => {
    return (_str: string) => {
      void _str;
      return Promise.resolve(h("div"));
    };
  }),
}));

import { h } from "vue";
import { drawGraph, type GraphInstance } from "../src/graph/graph.ts";
import {
  highlightNeighborhood,
  resetHighlight,
} from "../src/graph/graph-style.ts";
import type { Layout } from "../src/graph/graph-types.ts";
import { openNode } from "../src/graph/node.ts";
import { alphaColor } from "../src/utils/style.ts";

const NODE_ID = "11111111-1111-4111-8111-111111111111";

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

  it("sets colors for force-graph", () => {
    const nodeColor = vi.fn();
    const linkColor = vi.fn();
    const graph = {
      graphData: vi.fn(() => ({
        links: [
          { source: "id", target: "b", color: "#1" },
          { source: "b", target: "c", color: "#2" },
        ],
      })),
      nodeColor,
      linkColor,
    } as unknown as GraphInstance;
    highlightNeighborhood(graph, "id");
    const nodeFn = nodeColor.mock.calls[0][0];
    expect(nodeFn({ id: "id", color: "#a" })).toBe("#a");
    expect(nodeFn({ id: "b", color: "#b" })).toBe("#b");
    expect(nodeFn({ id: "c", color: "#c" })).toBe(alphaColor("#c", 0.15));
    const linkFn = linkColor.mock.calls[0][0];
    expect(linkFn({ source: "id", target: "b", color: "#1" })).toBe("#1");
    expect(linkFn({ source: "b", target: "c", color: "#2" })).toBe(
      alphaColor("#2", 0.05),
    );
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
      "fcose" as Layout,
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
      nodeThreeObject: vi.fn(() => fgInstance),
      nodeThreeObjectExtend: vi.fn(() => fgInstance),
      backgroundColor: vi.fn(() => fgInstance),
    } as unknown as object;
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
    expect(result).toEqual(fgInstance);
  });

  it("throws on api error", async () => {
    mockGet.mockResolvedValue({ data: {}, error: "bad" });
    await expect(
      drawGraph("cytoscape", "cose", container, undefined, 5, 1, true),
    ).rejects.toThrow("API error: bad");
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
    expect(result.body).toEqual(h("div"));
    expect(result.id).toBe(NODE_ID);
  });

  it("throws on api error", async () => {
    mockGet.mockResolvedValue({ data: {}, error: "oops" });
    await expect(openNode("light", NODE_ID)).rejects.toBe("oops");
  });
});

describe("resetHighlight", () => {
  it("resets opacity for cytoscape", () => {
    const style = vi.fn();
    const graph = {
      elements: vi.fn(() => ({ style })),
    } as unknown as import("cytoscape").Core;
    resetHighlight(graph);
    expect(style).toHaveBeenCalledWith("opacity", 1);
  });

  it("resets colors for force-graph", () => {
    const nodeColor = vi.fn();
    const linkColor = vi.fn();
    const graph = {
      nodeColor,
      linkColor,
    } as unknown as GraphInstance;
    resetHighlight(graph);
    expect(nodeColor).toHaveBeenCalledWith("color");
    expect(linkColor).toHaveBeenCalledWith("color");
  });

  it("handles undefined graph", () => {
    expect(() => resetHighlight(undefined)).not.toThrow();
  });
});
