import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { App } from "../src/app.tsx";
import * as util from "../src/util.ts";

beforeAll(() => {
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
});

vi.spyOn(util, "renderGraph").mockResolvedValue({
	on: vi.fn(),
	off: vi.fn(),
} as unknown as import("cytoscape").Core);

vi.spyOn(util, "dimOthers").mockImplementation(() => {});
vi.spyOn(util, "setElementsStyle").mockImplementation(() => {});

const openNodeSpy = vi.spyOn(util, "openNode");

describe("NodeDetails interaction", () => {
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
		expect(util.renderGraph).toHaveBeenCalledTimes(1);
	});
});
