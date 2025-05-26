import userEvent from "@testing-library/user-event";
import { cleanup, render } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";

var mockOpenNode: ReturnType<typeof vi.fn>;
vi.mock("../src/node.ts", () => {
	mockOpenNode = vi.fn();
	return { openNode: mockOpenNode };
});

import DetailsPanel from "../src/components/DetailsPanel.vue";
import { openNode } from "../src/node.ts";

afterEach(() => cleanup());

beforeEach(() => {
	mockOpenNode.mockResolvedValue({ body: h("p", "preview") });
});

const sampleNode = {
	id: "1",
	title: "Node",
	body: h("p", "html"),
	backlinks: [{ source: "2", title: "Back" }],
};

describe("DetailsPanel", () => {
	it("shows panel when open", () => {
		const { container } = render(
			DetailsPanel as unknown as Record<string, unknown>,
			{
				props: {
					open: true,
					selected: sampleNode,
					theme: "light",
				},
			},
		);
		expect(
			container.querySelector("#offcanvasDetails")?.classList.contains("show"),
		).toBe(true);
	});

	it("emits close on button click", async () => {
		const user = userEvent.setup();
		const { container, emitted } = render(
			DetailsPanel as unknown as Record<string, unknown>,
			{
				props: {
					open: true,
					selected: sampleNode,
					theme: "light",
				},
			},
		);
		const btn = container.querySelector(
			"button[aria-label='Close']",
		) as HTMLElement;
		await user.click(btn);
		expect(emitted().close).toHaveLength(1);
	});

	it("emits openNode on backlink click", async () => {
		const user = userEvent.setup();
		const { getAllByText, emitted } = render(
			DetailsPanel as unknown as Record<string, unknown>,
			{
				props: {
					open: true,
					selected: sampleNode,
					theme: "light",
				},
			},
		);
		await user.click(getAllByText("Back")[0]);
		expect(emitted().openNode[0]).toEqual(["2"]);
	});

	it("shows preview on hover and hides on close", async () => {
		const user = userEvent.setup();
		const body = h("p", [h("a", { href: "id:2" }, "link")]);
		const { container, rerender } = render(
			DetailsPanel as unknown as Record<string, unknown>,
			{
				props: {
					open: true,
					selected: { ...sampleNode, body },
					theme: "light",
				},
			},
		);
		const anchor = container.querySelector("a") as HTMLElement;
		await user.hover(anchor);
		await Promise.resolve();
		expect(openNode).toHaveBeenCalledWith("light", "2");
		expect(document.body.querySelector(".preview-popover")).toBeTruthy();
		await rerender({
			open: false,
			selected: { ...sampleNode, body },
			theme: "light",
		});
		await Promise.resolve();
		expect(document.body.querySelector(".preview-popover")).toBeNull();
	});
});
