import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
vi.mock("openapi-fetch", () => ({
  default: vi.fn(() => ({ GET: (...args: unknown[]) => mockGet(...args) })),
}));

const mockRenderer = vi.fn(async (..._args: unknown[]) => ({}));
vi.mock("../src/renderers/cytoscape.ts", () => ({
  default: (...args: unknown[]) => mockRenderer(...args),
}));

import { drawGraph } from "../src/graph.ts";

beforeEach(() => {
  mockGet.mockReset();
  mockRenderer.mockReset();
});

describe("drawGraph", () => {
  it("applies edge color from css variable", async () => {
    document.documentElement.style.setProperty("--bs-secondary", "gray");
    mockGet.mockResolvedValue({
      data: {
        nodes: [{ id: "1", title: "n" }],
        edges: [{ source: "1", dest: "2" }],
      },
    });
    await drawGraph(
      "cytoscape",
      "cose",
      document.createElement("div"),
      undefined,
      10,
      1,
      true,
    );
    const edges = (mockRenderer.mock.calls[0] as unknown[])[1] as Array<{
      color: string;
    }>;
    expect(edges[0].color).toBe("gray");
  });
});
