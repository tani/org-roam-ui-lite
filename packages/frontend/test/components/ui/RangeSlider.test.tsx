import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RangeSlider } from "../../../src/components/ui/RangeSlider.tsx";

afterEach(() => {
	cleanup();
});

describe("RangeSlider Component", () => {
	it("renders with basic props", () => {
		const handleChange = vi.fn();
		render(
			<RangeSlider
				value={50}
				min={0}
				max={100}
				onChange={handleChange}
				label="Test Slider"
			/>,
		);

		expect(screen.getByText("Test Slider")).toBeInTheDocument();
		expect(screen.getByRole("slider")).toHaveValue("50");
		expect(screen.getByText(/Current:/)).toBeInTheDocument();
		expect(screen.getByText("50")).toBeInTheDocument();
	});

	it("displays unit correctly", () => {
		const handleChange = vi.fn();
		const { container } = render(
			<RangeSlider
				value={25}
				min={0}
				max={100}
				onChange={handleChange}
				unit="px"
			/>,
		);

		expect(screen.getByText(/Current:/)).toBeInTheDocument();
		expect(screen.getByText("25")).toBeInTheDocument();
		expect(container).toHaveTextContent("px");
	});

	it("uses custom formatter", () => {
		const handleChange = vi.fn();
		const formatter = (value: number) => value.toFixed(1);

		const { container } = render(
			<RangeSlider
				value={1.5}
				min={0}
				max={2}
				step={0.1}
				onChange={handleChange}
				formatter={formatter}
				unit="em"
			/>,
		);

		expect(screen.getByText(/Current:/)).toBeInTheDocument();
		expect(screen.getByText("1.5")).toBeInTheDocument();
		expect(container).toHaveTextContent("em");
	});

	it("handles change events", () => {
		const handleChange = vi.fn();
		render(
			<RangeSlider value={50} min={0} max={100} onChange={handleChange} />,
		);

		fireEvent.change(screen.getByRole("slider"), { target: { value: "75" } });
		expect(handleChange).toHaveBeenCalledWith(75);
	});

	it("renders without label", () => {
		const handleChange = vi.fn();
		render(
			<RangeSlider value={50} min={0} max={100} onChange={handleChange} />,
		);

		expect(screen.getByRole("slider")).toBeInTheDocument();
		expect(screen.queryByRole("heading")).not.toBeInTheDocument();
	});
});
