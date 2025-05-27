import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, render } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import { createPinia } from "pinia";
import { uiStorePlugin } from "../src/store/ui.ts";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

function createGraph() {
  return { onNodeClick: vi.fn(), off: vi.fn(), on: vi.fn() };
}
const mockDrawGraph = vi.fn(async (...args: unknown[]) => {
  void args;
  return createGraph();
});
const mockApplyNodeStyle = vi.fn();
const mockHighlightNeighborhood = vi.fn();
const mockResetHighlight = vi.fn();

const mockDestroyGraph = vi.fn();
vi.mock("../src/graph/graph.ts", () => ({
  drawGraph: (...args: unknown[]) => mockDrawGraph(...args),
  destroyGraph: (...args: unknown[]) => mockDestroyGraph(...args),
}));
vi.mock("../src/graph/graph-style.ts", () => ({
  applyNodeStyle: () => mockApplyNodeStyle(),
  highlightNeighborhood: () => mockHighlightNeighborhood(),
  resetHighlight: () => mockResetHighlight(),
}));

const mockOpenNode = vi.fn(async (...args: unknown[]) => {
  void args;
  return {
    id: "1",
    title: "Node",
    body: h("div"),
  };
});
vi.mock("../src/graph/node.ts", () => ({
  openNode: (theme: unknown, id: unknown) => mockOpenNode(theme, id),
}));

import App from "../src/App.vue";

afterEach(() => cleanup());

beforeEach(() => {
  mockDrawGraph.mockClear();
  mockApplyNodeStyle.mockClear();
  mockHighlightNeighborhood.mockClear();
  mockResetHighlight.mockClear();
  mockDestroyGraph.mockClear();
  mockOpenNode.mockClear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-bs-theme");
});

describe("App", () => {
  it("initializes graph on mount", async () => {
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    expect(mockDrawGraph).toHaveBeenCalledWith(
      "force-graph",
      "cose",
      expect.any(HTMLElement),
      undefined,
      10,
      0.5,
      true,
    );
  });

  it("toggles settings panel", async () => {
    const user = userEvent.setup();
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { container } = render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    const btn = container.querySelector("i.bi-gear")
      ?.parentElement as HTMLElement;
    await user.click(btn);
    expect(
      container.querySelector("#offcanvasSettings")?.classList.contains("show"),
    ).toBe(true);
    await user.click(btn);
    expect(
      container.querySelector("#offcanvasSettings")?.classList.contains("show"),
    ).toBe(false);
  });

  it("toggles details panel and highlights nodes", async () => {
    const user = userEvent.setup();
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { container } = render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    const btn = container.querySelector("i.bi-chevron-left")
      ?.parentElement as HTMLElement;
    await user.click(btn);
    expect(mockHighlightNeighborhood).toHaveBeenCalled();
    expect(
      container.querySelector("#offcanvasDetails")?.classList.contains("show"),
    ).toBe(true);
    await user.click(btn);
    expect(mockResetHighlight).toHaveBeenCalled();
    expect(
      container.querySelector("#offcanvasDetails")?.classList.contains("show"),
    ).toBe(false);
  });

  it("updates document theme on selection", async () => {
    const user = userEvent.setup();
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { getAllByRole } = render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    const selects = getAllByRole("combobox");
    await user.selectOptions(selects[0], "dark");
    await Promise.resolve();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
  });

  it("changes renderer via settings and refreshes", async () => {
    const user = userEvent.setup();
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { getAllByRole } = render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    mockDrawGraph.mockClear();
    await user.selectOptions(getAllByRole("combobox")[1], "cytoscape");
    await Promise.resolve();
    expect(mockDrawGraph).toHaveBeenCalled();
  });

  it("applies node style when node size changes in cytoscape mode", async () => {
    const user = userEvent.setup();
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { getAllByRole, container } = render(
      App as unknown as Record<string, unknown>,
      { global: { plugins: [pinia] } },
    );
    await Promise.resolve();
    await user.selectOptions(getAllByRole("combobox")[1], "cytoscape");
    await Promise.resolve();
    mockDrawGraph.mockClear();
    mockApplyNodeStyle.mockClear();
    const range = container.querySelector(
      "input[type='range']",
    ) as HTMLInputElement;
    if (range) await fireEvent.input(range, { target: { value: "20" } });
    expect(mockApplyNodeStyle).toHaveBeenCalled();
    expect(mockDrawGraph).not.toHaveBeenCalled();
  });

  it("opens node when graph emits click", async () => {
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { container } = render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    const graph = await mockDrawGraph.mock.results[0].value;
    const cb = graph.onNodeClick.mock.calls[0][0] as (node: {
      id: string;
    }) => Promise<void>;
    await cb({ id: "2" });
    await Promise.resolve();
    expect(mockOpenNode).toHaveBeenCalledWith("light", "2");
    expect(mockHighlightNeighborhood).toHaveBeenCalled();
    expect(
      container.querySelector("#offcanvasDetails")?.classList.contains("show"),
    ).toBe(true);
  });

  it("refreshes when node size changes in force-graph mode", async () => {
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { container } = render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    mockDrawGraph.mockClear();
    const range = container.querySelector(
      "input[type='range']",
    ) as HTMLInputElement;
    if (range) await fireEvent.input(range, { target: { value: "15" } });
    expect(mockDrawGraph).toHaveBeenCalled();
  });

  it("refreshes when label scale changes in force-graph mode", async () => {
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { container } = render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    mockDrawGraph.mockClear();
    const range = container.querySelectorAll(
      "input[type='range']",
    )[1] as HTMLInputElement;
    if (range) await fireEvent.input(range, { target: { value: "1" } });
    expect(mockDrawGraph).toHaveBeenCalled();
  });

  it("changes layout and refreshes", async () => {
    const user = userEvent.setup();
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { getAllByRole } = render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    await user.selectOptions(getAllByRole("combobox")[1], "cytoscape");
    await Promise.resolve();
    mockDrawGraph.mockClear();
    await user.selectOptions(getAllByRole("combobox")[2], "circle");
    await Promise.resolve();
    expect(mockDrawGraph).toHaveBeenCalled();
  });

  it("refreshes when toggling label visibility", async () => {
    const user = userEvent.setup();
    const pinia = createPinia();
    pinia.use(uiStorePlugin);
    const { container } = render(App as unknown as Record<string, unknown>, {
      global: { plugins: [pinia] },
    });
    await Promise.resolve();
    mockDrawGraph.mockClear();
    const checkbox = container.querySelector(
      "input[type='checkbox']",
    ) as HTMLInputElement;
    if (checkbox) await user.click(checkbox);
    expect(mockDrawGraph).toHaveBeenCalled();
  });
});
