import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { GraphContainer } from "../GraphContainer.tsx";

afterEach(() => {
	cleanup();
});

describe("GraphContainer Component", () => {
	it("renders div with correct classes", () => {
		const ref = createRef<HTMLDivElement>();
		const { container } = render(<GraphContainer graphRef={ref} />);

		const divElement = container.firstChild as HTMLDivElement;
		expect(divElement).toBeInTheDocument();
		expect(divElement).toHaveClass("h-100", "w-100");
	});

	it("forwards ref correctly", () => {
		const ref = createRef<HTMLDivElement>();
		render(<GraphContainer graphRef={ref} />);

		expect(ref.current).toBeInstanceOf(HTMLDivElement);
		expect(ref.current).toHaveClass("h-100", "w-100");
	});

	it("handles null ref gracefully", () => {
		const ref = { current: null };
		expect(() => {
			render(<GraphContainer graphRef={ref} />);
		}).not.toThrow();
	});
});
