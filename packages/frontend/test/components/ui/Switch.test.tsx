import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Switch } from "../../../src/components/ui/Switch.tsx";

afterEach(() => {
	cleanup();
});

describe("Switch Component", () => {
	it("renders with correct props", () => {
		const handleChange = vi.fn();
		const testId = `test-switch-${Math.random().toString(36).substr(2, 9)}`;
		render(
			<Switch
				id={testId}
				checked={true}
				onChange={handleChange}
				label="Test Switch"
			/>,
		);

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeChecked();

		const label = screen.getByText("Test Switch");
		expect(label).toBeInTheDocument();
	});

	it("handles change events", () => {
		const handleChange = vi.fn();
		const testId = `test-switch-${Math.random().toString(36).substr(2, 9)}`;
		render(
			<Switch
				id={testId}
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
		const testId = `test-switch-${Math.random().toString(36).substr(2, 9)}`;
		render(
			<Switch
				id={testId}
				checked={false}
				onChange={handleChange}
				label="Test Switch"
			/>,
		);

		const container = screen.getByRole("checkbox").parentElement;
		expect(container).toHaveClass("form-check", "form-switch");
	});
});
