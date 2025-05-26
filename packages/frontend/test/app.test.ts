import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent, render } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";

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
const mockDrawGraph = vi.fn(async (..._args: unknown[]) => createGraph());
const mockApplyNodeStyle = vi.fn();
const mockHighlightNeighborhood = vi.fn();
const mockResetHighlight = vi.fn();

vi.mock("../src/graph.ts", () => ({
	drawGraph: (...args: unknown[]) => mockDrawGraph(...args),
	applyNodeStyle: () => mockApplyNodeStyle(),
	highlightNeighborhood: () => mockHighlightNeighborhood(),
	resetHighlight: () => mockResetHighlight(),
}));

const mockOpenNode = vi.fn(async () => ({
	id: "1",
	title: "Node",
	body: h("div"),
}));
vi.mock("../src/node.ts", () => ({
	openNode: () => mockOpenNode(),
}));

import App from "../src/App.vue";

afterEach(() => cleanup());

beforeEach(() => {
	mockDrawGraph.mockClear();
	mockApplyNodeStyle.mockClear();
	mockHighlightNeighborhood.mockClear();
	mockResetHighlight.mockClear();
	mockOpenNode.mockClear();
	document.documentElement.removeAttribute("data-theme");
	document.documentElement.removeAttribute("data-bs-theme");
});

describe("App", () => {
	it("initializes graph on mount", async () => {
		render(App as unknown as Record<string, unknown>);
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
		const { container } = render(App as unknown as Record<string, unknown>);
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
		const { container } = render(App as unknown as Record<string, unknown>);
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
		const { getAllByRole } = render(App as unknown as Record<string, unknown>);
		await Promise.resolve();
		const selects = getAllByRole("combobox");
		await user.selectOptions(selects[0], "dark");
		await Promise.resolve();
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
		expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
	});

	it("changes renderer via settings and refreshes", async () => {
		const user = userEvent.setup();
		const { getAllByRole } = render(App as unknown as Record<string, unknown>);
		await Promise.resolve();
		mockDrawGraph.mockClear();
		await user.selectOptions(getAllByRole("combobox")[1], "cytoscape");
		await Promise.resolve();
		expect(mockDrawGraph).toHaveBeenCalled();
	});

	it("applies node style when node size changes in cytoscape mode", async () => {
		const user = userEvent.setup();
		const { getAllByRole, container } = render(
			App as unknown as Record<string, unknown>,
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
});
