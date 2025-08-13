import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GraphControls } from "../GraphControls.tsx";

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
		const settingsButton = buttons[0];
		expect(settingsButton).toHaveClass(
			"btn",
			"btn-outline-secondary",
			"position-fixed",
		);
		expect(settingsButton).toHaveStyle({
			top: "1rem",
			left: "1rem",
			zIndex: "1",
		});

		// Details button (chevron icon)
		const detailsButton = buttons[1];
		expect(detailsButton).toHaveClass(
			"btn",
			"btn-outline-secondary",
			"position-fixed",
		);
		expect(detailsButton).toHaveStyle({
			top: "1rem",
			right: "1rem",
			zIndex: "1",
		});
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

		const buttons = screen.getAllByRole("button");

		// Check for Bootstrap icons
		expect(buttons[0]).toContainHTML('<i class="bi bi-gear"></i>');
		expect(buttons[1]).toContainHTML('<i class="bi bi-chevron-left"></i>');
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
			expect(button).toHaveStyle("top: 1rem");
		});

		// Check specific positioning
		expect(buttons[0]).toHaveStyle("left: 1rem");
		expect(buttons[1]).toHaveStyle("right: 1rem");
	});
});
