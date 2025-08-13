import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { When } from "../../../src/components/ui/When.tsx";

describe("When", () => {
	it("renders children when condition is true", () => {
		const { getByText } = render(
			<When condition={true}>
				<div>Test Content</div>
			</When>,
		);

		expect(getByText("Test Content")).toBeInTheDocument();
	});

	it("does not render children when condition is false", () => {
		const { container } = render(
			<When condition={false}>
				<div>Test Content</div>
			</When>,
		);

		expect(container.firstChild).toBeNull();
	});

	it("renders multiple children when condition is true", () => {
		const { getByText } = render(
			<When condition={true}>
				<div>First Child</div>
				<div>Second Child</div>
			</When>,
		);

		expect(getByText("First Child")).toBeInTheDocument();
		expect(getByText("Second Child")).toBeInTheDocument();
	});
});
