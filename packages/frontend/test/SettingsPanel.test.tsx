import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsPanel } from "../src/components/SettingsPanel.tsx";
import { Layouts, Renderers, Themes } from "../src/graph/graph-types.ts";

describe("SettingsPanel", () => {
	it("renders the settings panel and handles close", () => {
		const handleClose = vi.fn();
		const handleChange = vi.fn();

		render(
			<SettingsPanel
				open={true}
				themes={Themes}
				renderers={Renderers}
				layouts={Layouts}
				theme="dark"
				renderer="force-graph"
				layout="cose"
				nodeSize={10}
				labelScale={1}
				showLabels={true}
				onThemeChange={handleChange}
				onRendererChange={handleChange}
				onLayoutChange={handleChange}
				onNodeSizeChange={handleChange}
				onLabelScaleChange={handleChange}
				onShowLabelsChange={handleChange}
				onClose={handleClose}
			/>,
		);

		expect(screen.getByText("Settings")).toBeInTheDocument();

		const closeButton = screen.getByLabelText("Close");
		fireEvent.click(closeButton);
		expect(handleClose).toHaveBeenCalledTimes(1);
	});
});
