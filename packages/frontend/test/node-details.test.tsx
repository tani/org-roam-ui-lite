import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as util from "../src/util.ts";

let App: typeof import("../src/app.tsx").App;

beforeAll(async () => {
	Object.defineProperty(globalThis, "matchMedia", {
		writable: true,
		value: vi.fn().mockReturnValue({
			matches: false,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}),
	});
	({ App } = await import("../src/app.tsx"));
});

const renderGraphSpy = vi.spyOn(util, "renderGraph");
renderGraphSpy.mockResolvedValue({
	on: vi.fn(),
	off: vi.fn(),
} as unknown as import("cytoscape").Core);

vi.spyOn(util, "dimOthers").mockImplementation(() => {});
vi.spyOn(util, "setElementsStyle").mockImplementation(() => {});

const openNodeSpy = vi.spyOn(util, "openNode");

describe("NodeDetails interaction", () => {
	beforeEach(() => {
		renderGraphSpy.mockClear();
	});

	it("follows backlink and resets styles", async () => {
		openNodeSpy
			.mockResolvedValueOnce({
				id: "a",
				title: "A",
				raw: "",
				html: "<p>a</p>",
				backlinks: [{ source: "b", title: "B" }],
			} as Awaited<ReturnType<typeof util.openNode>>)
			.mockResolvedValueOnce({
				id: "b",
				title: "B",
				raw: "",
				html: "<p>b</p>",
				backlinks: [],
			} as Awaited<ReturnType<typeof util.openNode>>);

		window.history.pushState({}, "", "/node/a");
		render(<App />);

		await waitFor(() => {
			expect(openNodeSpy).toHaveBeenCalledWith("light", "a");
		});

		fireEvent.click(screen.getByRole("button", { name: /b$/i }));

		await waitFor(() => {
			expect(openNodeSpy).toHaveBeenLastCalledWith("light", "b");
		});

		expect(util.dimOthers).toHaveBeenCalledWith(expect.anything(), "a");
		expect(util.setElementsStyle).toHaveBeenCalledWith(expect.anything(), {
			opacity: 1,
		});
		expect(renderGraphSpy).toHaveBeenCalledTimes(2);
	});
});
