import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../Button.tsx";

afterEach(() => {
	cleanup();
});

describe("Button Component", () => {
	it("renders with default props", () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("btn", "btn-primary");
		expect(button).toHaveTextContent("Click me");
	});

	it("applies variant classes correctly", () => {
		render(<Button variant="outline-secondary">Test</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("btn", "btn-outline-secondary");
	});

	it("renders close button variant", () => {
		render(<Button variant="close" aria-label="Close" />);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("btn-close");
		expect(button).not.toHaveClass("btn");
	});

	it("handles click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);
		fireEvent.click(screen.getByRole("button"));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("applies custom className and style", () => {
		render(
			<Button className="custom-class" style={{ margin: "10px" }}>
				Test
			</Button>,
		);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom-class");
		expect(button).toHaveStyle("margin: 10px");
	});

	it("supports disabled state", () => {
		render(<Button disabled>Disabled</Button>);
		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
	});
});
