import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DetailsPanel } from "../src/components/DetailsPanel.tsx";

// Mock openNode function
vi.mock("../src/graph/node.ts", () => ({
	openNode: vi.fn(),
}));

// Mock PreviewPopover
vi.mock("../src/components/PreviewPopover.tsx", () => ({
	PreviewPopover: vi.fn(({ content, onLeave }) => (
		<div data-testid="preview-popover" role="tooltip" onMouseLeave={onLeave}>
			{content}
		</div>
	)),
}));

describe("DetailsPanel", () => {
	const mockOnClose = vi.fn();
	const mockOnOpenNode = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders node details and handles backlink clicks", () => {
		const mockSelectedNode = {
			id: "node1",
			title: "Node 1 Title",
			raw: "Node 1 Body",
			body: <div>Node 1 Body</div>,
			backlinks: [{ source: "node2", title: "Node 2 Title" }],
			file: "test.org",
			level: 1,
			pos: 0,
			todo: null,
			scheduled: null,
			deadline: null,
			tags: [],
			refs: [],
		};

		render(
			<DetailsPanel
				open={true}
				selected={mockSelectedNode}
				theme="dark"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		expect(screen.getByText("Node 1 Title")).toBeInTheDocument();
		expect(screen.getByText("Backlinks")).toBeInTheDocument();

		const backlinkButton = screen.getByText("Node 2 Title");
		fireEvent.click(backlinkButton);
		expect(mockOnOpenNode).toHaveBeenCalledWith("node2");
	});

	it("renders with empty selected node", () => {
		const emptyNode = {
			id: "",
			title: "",
			raw: "",
			body: <div>Click a node to view details</div>,
		};

		render(
			<DetailsPanel
				open={true}
				selected={emptyNode}
				theme="light"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		expect(
			screen.getByText("Click a node to view details"),
		).toBeInTheDocument();
	});

	it("handles close button click", () => {
		const mockSelectedNode = {
			id: "node1",
			title: "Test Node",
			raw: "content",
			body: <div>Content</div>,
			file: "test.org",
			level: 1,
			pos: 0,
			todo: null,
			scheduled: null,
			deadline: null,
			tags: [],
			refs: [],
		};

		render(
			<DetailsPanel
				open={true}
				selected={mockSelectedNode}
				theme="light"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		const closeButtons = screen.getAllByLabelText("Close");
		if (closeButtons[0]) {
			fireEvent.click(closeButtons[0]);
		}
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it("applies correct CSS classes when open", () => {
		const mockSelectedNode = {
			id: "node1",
			title: "Test Node",
			raw: "content",
			body: <div>Content</div>,
			file: "test.org",
			level: 1,
			pos: 0,
			todo: null,
			scheduled: null,
			deadline: null,
			tags: [],
			refs: [],
		};

		const { container } = render(
			<DetailsPanel
				open={true}
				selected={mockSelectedNode}
				theme="light"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		const panel = container.querySelector('[role="dialog"]');
		expect(panel).toHaveClass(
			"offcanvas",
			"offcanvas-end",
			"responsive-wide",
			"show",
		);
	});

	it("does not apply show class when closed", () => {
		const mockSelectedNode = {
			id: "node1",
			title: "Test Node",
			raw: "content",
			body: <div>Content</div>,
			file: "test.org",
			level: 1,
			pos: 0,
			todo: null,
			scheduled: null,
			deadline: null,
			tags: [],
			refs: [],
		};

		const { container } = render(
			<DetailsPanel
				open={false}
				selected={mockSelectedNode}
				theme="light"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		const panel = container.querySelector('[role="dialog"]');
		expect(panel).not.toHaveClass("show");
	});

	it("renders node body content", () => {
		const mockSelectedNode = {
			id: "node1",
			title: "Test Node",
			raw: "content",
			body: <div data-testid="node-body">Custom body content</div>,
			file: "test.org",
			level: 1,
			pos: 0,
			todo: null,
			scheduled: null,
			deadline: null,
			tags: [],
			refs: [],
		};

		render(
			<DetailsPanel
				open={true}
				selected={mockSelectedNode}
				theme="light"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		expect(screen.getByTestId("node-body")).toHaveTextContent(
			"Custom body content",
		);
	});

	it("handles nodes without backlinks", () => {
		const mockSelectedNode = {
			id: "node1",
			title: "Test Node",
			raw: "content",
			body: <div>Content</div>,
			file: "test.org",
			level: 1,
			pos: 0,
			todo: null,
			scheduled: null,
			deadline: null,
			tags: [],
			refs: [],
		};

		render(
			<DetailsPanel
				open={true}
				selected={mockSelectedNode}
				theme="light"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		expect(screen.queryByText("Backlinks")).not.toBeInTheDocument();
	});

	it("handles links in rendered content", async () => {
		const mockSelectedNode = {
			id: "node1",
			title: "Test Node",
			raw: "content",
			body: (
				<div>
					<a href="id:linked-node">Link to another node</a>
				</div>
			),
			file: "test.org",
			level: 1,
			pos: 0,
			todo: null,
			scheduled: null,
			deadline: null,
			tags: [],
			refs: [],
		};

		render(
			<DetailsPanel
				open={true}
				selected={mockSelectedNode}
				theme="light"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		const link = screen.getByText("Link to another node");
		fireEvent.click(link);

		expect(mockOnOpenNode).toHaveBeenCalledWith("linked-node");
	});

	it("handles keyboard navigation on rendered content", () => {
		const mockSelectedNode = {
			id: "node1",
			title: "Test Node",
			raw: "content",
			body: (
				<div>
					<a href="id:linked-node">Link to another node</a>
				</div>
			),
			file: "test.org",
			level: 1,
			pos: 0,
			todo: null,
			scheduled: null,
			deadline: null,
			tags: [],
			refs: [],
		};

		render(
			<DetailsPanel
				open={true}
				selected={mockSelectedNode}
				theme="light"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		const contentSection = screen.getByLabelText("Details content");

		fireEvent.keyDown(contentSection, { key: "Enter" });
		fireEvent.keyDown(contentSection, { key: " " });

		// Since we're testing the keyDown handler, verify it doesn't crash
		expect(contentSection).toBeInTheDocument();
	});

	it("renders multiple backlinks correctly", () => {
		const mockSelectedNode = {
			id: "node1",
			title: "Test Node",
			raw: "content",
			body: <div>Content</div>,
			backlinks: [
				{ source: "node2", title: "First Backlink" },
				{ source: "node3", title: "Second Backlink" },
			],
			file: "test.org",
			level: 1,
			pos: 0,
			todo: null,
			scheduled: null,
			deadline: null,
			tags: [],
			refs: [],
		};

		render(
			<DetailsPanel
				open={true}
				selected={mockSelectedNode}
				theme="light"
				onClose={mockOnClose}
				onOpenNode={mockOnOpenNode}
			/>,
		);

		expect(screen.getByText("First Backlink")).toBeInTheDocument();
		expect(screen.getByText("Second Backlink")).toBeInTheDocument();

		fireEvent.click(screen.getByText("Second Backlink"));
		expect(mockOnOpenNode).toHaveBeenCalledWith("node3");
	});
});
