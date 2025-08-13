import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { Switch } from "../Switch.tsx";

afterEach(() => {
	cleanup();
});

describe("Switch Component", () => {
	it("renders with correct props", () => {
		const handleChange = vi.fn();
		render(
			<Switch
				id="test-switch"
				checked={true}
				onChange={handleChange}
				label="Test Switch"
			/>,
		);

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeChecked();
		expect(checkbox).toHaveAttribute("id", "test-switch");

		const label = screen.getByText("Test Switch");
		expect(label).toBeInTheDocument();
		expect(label).toHaveAttribute("for", "test-switch");
	});

	it("handles change events", () => {
		const handleChange = vi.fn();
		render(
			<Switch
				id="test-switch"
				checked={false}
				onChange={handleChange}
				label="Test Switch"
			/>,
		);

		fireEvent.click(screen.getByRole("checkbox"));
		expect(handleChange).toHaveBeenCalledWith(true);
	});

	it("applies Bootstrap classes", () => {
		const handleChange = vi.fn();
		render(
			<Switch
				id="test-switch"
				checked={false}
				onChange={handleChange}
				label="Test Switch"
			/>,
		);

		const container = screen.getByRole("checkbox").parentElement;
		expect(container).toHaveClass("form-check", "form-switch");
	});
});
