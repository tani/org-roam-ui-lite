import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { FormGroup } from "../FormGroup.tsx";

afterEach(() => {
	cleanup();
});

describe("FormGroup Component", () => {
	it("renders with label and children", () => {
		render(
			<FormGroup label="Test Group">
				<input type="text" />
			</FormGroup>,
		);

		expect(screen.getByText("Test Group")).toBeInTheDocument();
		expect(screen.getByRole("textbox")).toBeInTheDocument();
	});

	it("applies default className", () => {
		render(
			<FormGroup label="Test Group">
				<input type="text" />
			</FormGroup>,
		);

		const container = screen.getByText("Test Group").parentElement;
		expect(container).toHaveClass("mb-4");
	});

	it("applies custom className", () => {
		render(
			<FormGroup label="Test Group" className="custom-group">
				<input type="text" />
			</FormGroup>,
		);

		const container = screen.getByText("Test Group").parentElement;
		expect(container).toHaveClass("custom-group");
	});

	it("renders label as h5", () => {
		render(
			<FormGroup label="Test Group">
				<input type="text" />
			</FormGroup>,
		);

		const heading = screen.getByRole("heading", { level: 5 });
		expect(heading).toHaveTextContent("Test Group");
	});
});
