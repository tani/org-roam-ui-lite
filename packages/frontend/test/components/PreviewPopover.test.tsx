import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PreviewPopover } from "../../src/components/PreviewPopover.tsx";

// Mock createPortal to render the element directly
vi.mock("react-dom", () => ({
	createPortal: (element: React.ReactNode) => element,
}));

describe("PreviewPopover", () => {
	const mockOnLeave = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	test("renders with content", () => {
		render(
			<PreviewPopover
				content={<div>Test content</div>}
				x={100}
				y={200}
				onLeave={mockOnLeave}
			/>,
		);

		expect(screen.getByText("Test content")).toBeInTheDocument();
	});

	test("applies correct CSS classes", () => {
		const { container } = render(
			<PreviewPopover
				content={<div>Test content</div>}
				x={100}
				y={200}
				onLeave={mockOnLeave}
			/>,
		);

		const popover = container.querySelector('[role="tooltip"]');
		expect(popover).toHaveClass("card", "p-2", "preview-popover");
	});

	test("has accessibility attributes", () => {
		const { container } = render(
			<PreviewPopover
				content={<div>Test content</div>}
				x={100}
				y={200}
				onLeave={mockOnLeave}
			/>,
		);

		const popover = container.querySelector('[role="tooltip"]');
		expect(popover).toHaveAttribute("aria-label", "Preview popover");
	});

	test("renders with basic props", () => {
		render(
			<PreviewPopover
				content="Simple content"
				x={0}
				y={0}
				onLeave={mockOnLeave}
			/>,
		);

		expect(screen.getByText("Simple content")).toBeInTheDocument();
	});
});
