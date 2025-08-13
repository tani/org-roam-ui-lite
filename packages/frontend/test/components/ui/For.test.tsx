import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { For } from "../../../src/components/ui/For.tsx";

describe("For", () => {
	it("renders items from array", () => {
		const items = ["apple", "banana", "cherry"];
		const { getByText } = render(
			<For list={items}>{({ item }) => <div key={item}>{item}</div>}</For>,
		);

		expect(getByText("apple")).toBeInTheDocument();
		expect(getByText("banana")).toBeInTheDocument();
		expect(getByText("cherry")).toBeInTheDocument();
	});

	it("provides correct index to children", () => {
		const items = ["first", "second", "third"];
		const { getByText } = render(
			<For list={items}>
				{({ item, index }) => (
					<div key={item}>
						{item}-{index}
					</div>
				)}
			</For>,
		);

		expect(getByText("first-0")).toBeInTheDocument();
		expect(getByText("second-1")).toBeInTheDocument();
		expect(getByText("third-2")).toBeInTheDocument();
	});

	it("renders nothing when list is empty", () => {
		const { container } = render(
			<For list={[]}>{({ item }) => <div key={item}>{item}</div>}</For>,
		);

		expect(container.firstChild).toBeNull();
	});

	it("works with object arrays", () => {
		const items = [
			{ id: 1, name: "John" },
			{ id: 2, name: "Jane" },
		];
		const { getByText } = render(
			<For list={items}>
				{({ item }) => <div key={item.id}>{item.name}</div>}
			</For>,
		);

		expect(getByText("John")).toBeInTheDocument();
		expect(getByText("Jane")).toBeInTheDocument();
	});

	it("works with numbers", () => {
		const items = [1, 2, 3];
		const { getByText } = render(
			<For list={items}>
				{({ item, index }) => <div key={index}>Number: {item}</div>}
			</For>,
		);

		expect(getByText("Number: 1")).toBeInTheDocument();
		expect(getByText("Number: 2")).toBeInTheDocument();
		expect(getByText("Number: 3")).toBeInTheDocument();
	});
});
