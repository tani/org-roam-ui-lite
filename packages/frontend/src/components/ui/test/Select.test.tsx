import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Select } from "../Select.tsx";

afterEach(() => {
	cleanup();
});

describe("Select Component", () => {
	const mockOptions = [
		{ value: "option1", label: "Option 1" },
		{ value: "option2", label: "Option 2" },
	];

	it("renders with object options", () => {
		const handleChange = vi.fn();
		render(
			<Select value="option1" options={mockOptions} onChange={handleChange} />,
		);

		const select = screen.getByRole("combobox");
		expect(select).toBeInTheDocument();
		expect(select).toHaveValue("option1");

		expect(screen.getByText("Option 1")).toBeInTheDocument();
		expect(screen.getByText("Option 2")).toBeInTheDocument();
	});

	it("renders with string options", () => {
		const stringOptions = ["red", "blue", "green"];
		const handleChange = vi.fn();

		render(
			<Select value="red" options={stringOptions} onChange={handleChange} />,
		);

		const select = screen.getByRole("combobox");
		expect(select).toHaveValue("red");
		expect(screen.getByText("red")).toBeInTheDocument();
		expect(screen.getByText("blue")).toBeInTheDocument();
		expect(screen.getByText("green")).toBeInTheDocument();
	});

	it("handles change events", () => {
		const handleChange = vi.fn();
		render(
			<Select value="option1" options={mockOptions} onChange={handleChange} />,
		);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "option2" },
		});
		expect(handleChange).toHaveBeenCalledWith("option2");
	});

	it("applies custom className", () => {
		const handleChange = vi.fn();
		render(
			<Select
				value="option1"
				options={mockOptions}
				onChange={handleChange}
				className="custom-select"
			/>,
		);

		expect(screen.getByRole("combobox")).toHaveClass("custom-select");
	});
});
