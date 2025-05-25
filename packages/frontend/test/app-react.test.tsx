import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { App } from "../src/app.tsx";
import * as util from "../src/util.ts";

describe("App router integration", () => {
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
	vi.spyOn(util, "openNode").mockResolvedValue({
		id: "n",
		title: "Node",
		raw: "",
		html: "<p>body</p>",
	} as Awaited<ReturnType<typeof util.openNode>>);

	it("loads node from route", async () => {
		window.history.pushState({}, "", "/node/abc");
		render(<App />);
		await waitFor(() => {
			expect(util.openNode).toHaveBeenCalledWith("light", "abc");
		});
	});
});
