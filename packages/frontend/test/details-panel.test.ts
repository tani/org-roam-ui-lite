import userEvent from "@testing-library/user-event";
import { cleanup, render } from "@testing-library/vue";
import { afterEach, describe, expect, it } from "vitest";
import DetailsPanel from "../src/components/DetailsPanel.vue";

afterEach(() => cleanup());

const sampleNode = {
	id: "1",
	title: "Node",
	html: "<p>html</p>",
	backlinks: [{ source: "2", title: "Back" }],
};

describe("DetailsPanel", () => {
	it("shows panel when open", () => {
		const { container } = render(
			DetailsPanel as unknown as Record<string, unknown>,
			{
				props: { open: true, selected: sampleNode },
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
				props: { open: true, selected: sampleNode },
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
				props: { open: true, selected: sampleNode },
			},
		);
		await user.click(getAllByText("Back")[0]);
		expect(emitted().openNode[0]).toEqual(["2"]);
	});
});
