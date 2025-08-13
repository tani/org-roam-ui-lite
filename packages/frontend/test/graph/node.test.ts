import { beforeEach, describe, expect, test, vi } from "vitest";
import type { components } from "../../src/api/api.d.ts";

// Mock the API client
const mockGET = vi.fn();
vi.mock("openapi-fetch", () => ({
	default: vi.fn(() => ({
		GET: mockGET,
	})),
}));

// Mock the processor
const mockCreateOrgHtmlProcessor = vi.fn();
const mockProcess = vi.fn();
vi.mock("../../src/utils/processor.ts", () => ({
	createOrgHtmlProcessor: mockCreateOrgHtmlProcessor,
}));

describe("openNode", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateOrgHtmlProcessor.mockReturnValue(mockProcess);
	});

	test("fetches node data and processes content successfully", async () => {
		const { openNode } = await import("../../src/graph/node.ts");

		const mockNodeData: components["schemas"]["Node"] = {
			id: "test-node",
			title: "Test Node",
			raw: "* Test heading\nSome content",
		};

		const mockProcessedBody = "Processed content";

		mockGET.mockResolvedValue({
			data: mockNodeData,
			error: undefined,
		});
		mockProcess.mockResolvedValue(mockProcessedBody);

		const result = await openNode("dark", "test-node");

		expect(mockGET).toHaveBeenCalledWith("/api/node/{id}.json", {
			params: { path: { id: "test-node" } },
		});
		expect(mockCreateOrgHtmlProcessor).toHaveBeenCalledWith(
			"dark",
			"test-node",
		);
		expect(mockProcess).toHaveBeenCalledWith("* Test heading\nSome content");
		expect(result).toEqual({
			...mockNodeData,
			body: mockProcessedBody,
		});
	});

	test("throws error when API returns error", async () => {
		const { openNode } = await import("../../src/graph/node.ts");

		const apiError = { message: "Node not found", status: 404 };
		mockGET.mockResolvedValue({
			data: undefined,
			error: apiError,
		});

		await expect(openNode("light", "nonexistent-node")).rejects.toEqual(
			apiError,
		);
		expect(mockCreateOrgHtmlProcessor).not.toHaveBeenCalled();
		expect(mockProcess).not.toHaveBeenCalled();
	});

	test("passes correct theme to processor", async () => {
		const { openNode } = await import("../../src/graph/node.ts");

		const mockNodeData: components["schemas"]["Node"] = {
			id: "theme-test",
			title: "Theme Test",
			raw: "Content",
		};

		mockGET.mockResolvedValue({
			data: mockNodeData,
			error: undefined,
		});
		mockProcess.mockResolvedValue("Content");

		await openNode("light", "theme-test");

		expect(mockCreateOrgHtmlProcessor).toHaveBeenCalledWith(
			"light",
			"theme-test",
		);
	});

	test("handles different themes correctly", async () => {
		const { openNode } = await import("../../src/graph/node.ts");

		const mockNodeData: components["schemas"]["Node"] = {
			id: "multi-theme",
			title: "Multi Theme",
			raw: "Test content",
		};

		mockGET.mockResolvedValue({
			data: mockNodeData,
			error: undefined,
		});
		mockProcess.mockResolvedValue("Processed");

		// Test dark theme
		await openNode("dark", "multi-theme");
		expect(mockCreateOrgHtmlProcessor).toHaveBeenLastCalledWith(
			"dark",
			"multi-theme",
		);

		// Test light theme
		await openNode("light", "multi-theme");
		expect(mockCreateOrgHtmlProcessor).toHaveBeenLastCalledWith(
			"light",
			"multi-theme",
		);
	});

	test("preserves all node properties and adds body", async () => {
		const { openNode } = await import("../../src/graph/node.ts");

		const mockNodeData: components["schemas"]["Node"] = {
			id: "comprehensive-node",
			title: "Comprehensive Node",
			raw: "Raw org content",
		};

		const mockProcessedBody = "Complex processed content";

		mockGET.mockResolvedValue({
			data: mockNodeData,
			error: undefined,
		});
		mockProcess.mockResolvedValue(mockProcessedBody);

		const result = await openNode("dark", "comprehensive-node");

		expect(result).toEqual({
			id: "comprehensive-node",
			title: "Comprehensive Node",
			raw: "Raw org content",
			body: mockProcessedBody,
		});
	});

	test("module structure is correct", async () => {
		const nodeModule = await import("../../src/graph/node.ts");
		expect(nodeModule).toHaveProperty("openNode");
		expect(typeof nodeModule.openNode).toBe("function");
	});
});
