import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GraphControls } from "../../src/components/GraphControls.tsx";

afterEach(() => {
	cleanup();
});

describe("GraphControls Component", () => {
	it("renders both control buttons", () => {
		const mockToggleSettings = vi.fn();
		const mockToggleDetails = vi.fn();

		render(
			<GraphControls
				onToggleSettings={mockToggleSettings}
				onToggleDetails={mockToggleDetails}
			/>,
		);

		const buttons = screen.getAllByRole("button");
		expect(buttons).toHaveLength(2);

		// Settings button (gear icon)
		const settingsButton = buttons[0] as HTMLElement;
		expect(settingsButton).toHaveClass(
			"btn",
			"btn-outline-secondary",
			"position-fixed",
		);
		// Check positioning (1rem is converted to 16px by the browser)
		expect(settingsButton.style.zIndex).toBe("1");
		const settingsTop = settingsButton.style.top;
		const settingsLeft = settingsButton.style.left;
		expect(settingsTop === "1rem" || settingsTop === "16px").toBe(true);
		expect(settingsLeft === "1rem" || settingsLeft === "16px").toBe(true);

		// Details button (chevron icon)
		const detailsButton = buttons[1] as HTMLElement;
		expect(detailsButton).toHaveClass(
			"btn",
			"btn-outline-secondary",
			"position-fixed",
		);
		expect(detailsButton.style.zIndex).toBe("1");
		const detailsTop = detailsButton.style.top;
		const detailsRight = detailsButton.style.right;
		expect(detailsTop === "1rem" || detailsTop === "16px").toBe(true);
		expect(detailsRight === "1rem" || detailsRight === "16px").toBe(true);
	});

	it("renders correct icons", () => {
		const mockToggleSettings = vi.fn();
		const mockToggleDetails = vi.fn();

		render(
			<GraphControls
				onToggleSettings={mockToggleSettings}
				onToggleDetails={mockToggleDetails}
			/>,
		);

		// Check for SVG icons with bi class (use direct children of buttons to avoid nested SVGs)
		const buttons = screen.getAllByRole("button");
		const svgInSettings = (buttons[0] as HTMLElement).querySelector("svg.bi");
		const svgInDetails = (buttons[1] as HTMLElement).querySelector("svg.bi");
		expect(svgInSettings).toBeInTheDocument();
		expect(svgInDetails).toBeInTheDocument();
	});

	it("handles settings button click", () => {
		const mockToggleSettings = vi.fn();
		const mockToggleDetails = vi.fn();

		render(
			<GraphControls
				onToggleSettings={mockToggleSettings}
				onToggleDetails={mockToggleDetails}
			/>,
		);

		const buttons = screen.getAllByRole("button");
		fireEvent.click(buttons.at(0) as HTMLElement); // Settings button

		expect(mockToggleSettings).toHaveBeenCalledTimes(1);
		expect(mockToggleDetails).not.toHaveBeenCalled();
	});

	it("handles details button click", () => {
		const mockToggleSettings = vi.fn();
		const mockToggleDetails = vi.fn();

		render(
			<GraphControls
				onToggleSettings={mockToggleSettings}
				onToggleDetails={mockToggleDetails}
			/>,
		);

		const buttons = screen.getAllByRole("button");
		fireEvent.click(buttons.at(1) as HTMLElement); // Details button

		expect(mockToggleDetails).toHaveBeenCalledTimes(1);
		expect(mockToggleSettings).not.toHaveBeenCalled();
	});

	it("applies button styles correctly", () => {
		const mockToggleSettings = vi.fn();
		const mockToggleDetails = vi.fn();

		render(
			<GraphControls
				onToggleSettings={mockToggleSettings}
				onToggleDetails={mockToggleDetails}
			/>,
		);

		const buttons = screen.getAllByRole("button");

		// Both buttons should have the same base classes
		buttons.forEach((button) => {
			expect(button).toHaveClass(
				"btn",
				"btn-outline-secondary",
				"position-fixed",
			);
			expect(button).toHaveStyle("zIndex: 1");
			// 1rem is converted to 16px by the browser
			const topStyle = button.style.top;
			expect(topStyle === "1rem" || topStyle === "16px").toBe(true);
		});

		// Check specific positioning (1rem = 16px)
		const leftStyle = (buttons[0] as HTMLElement).style.left;
		expect(leftStyle === "1rem" || leftStyle === "16px").toBe(true);

		const rightStyle = (buttons[1] as HTMLElement).style.right;
		expect(rightStyle === "1rem" || rightStyle === "16px").toBe(true);
	});
});
