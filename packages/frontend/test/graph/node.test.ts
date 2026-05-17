import { beforeEach, describe, expect, test, vi } from "vitest";
import type { components } from "../../src/api/api.d.ts";

// Use vi.hoisted to define mocks
const { mockGET, processorMocks } = vi.hoisted(() => ({
	mockGET: vi.fn(),
	processorMocks: {
		createOrgHtmlProcessor: vi.fn(),
		process: vi.fn(),
	},
}));

// Mock the API client
vi.mock("openapi-fetch", () => ({
	default: vi.fn(() => ({
		GET: mockGET,
	})),
}));

// Mock the processor
vi.mock("../../src/utils/processor.ts", () => ({
	createOrgHtmlProcessor: processorMocks.createOrgHtmlProcessor,
}));

import { openNode } from "../../src/graph/node.ts";

describe("openNode", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		processorMocks.createOrgHtmlProcessor.mockReturnValue(
			processorMocks.process,
		);
	});

	test("fetches node data and processes content successfully", async () => {
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
		processorMocks.process.mockResolvedValue(mockProcessedBody);

		const result = await openNode("dark", "test-node");

		expect(mockGET).toHaveBeenCalledWith("/api/node/{id}.json", {
			params: { path: { id: "test-node" } },
		});
		expect(processorMocks.createOrgHtmlProcessor).toHaveBeenCalledWith(
			"dark",
			"test-node",
		);
		expect(processorMocks.process).toHaveBeenCalledWith(
			"* Test heading\nSome content",
		);
		expect(result).toEqual({
			...mockNodeData,
			body: mockProcessedBody,
		});
	});

	test("throws error when API returns error", async () => {
		const apiError = { message: "Node not found", status: 404 };
		mockGET.mockResolvedValue({
			data: undefined,
			error: apiError,
		});

		await expect(openNode("light", "nonexistent-node")).rejects.toEqual(
			apiError,
		);
		expect(processorMocks.createOrgHtmlProcessor).not.toHaveBeenCalled();
		expect(processorMocks.process).not.toHaveBeenCalled();
	});

	test("passes correct theme to processor", async () => {
		const mockNodeData: components["schemas"]["Node"] = {
			id: "theme-test",
			title: "Theme Test",
			raw: "Content",
		};

		mockGET.mockResolvedValue({
			data: mockNodeData,
			error: undefined,
		});
		processorMocks.process.mockResolvedValue("Content");

		await openNode("light", "theme-test");

		expect(processorMocks.createOrgHtmlProcessor).toHaveBeenCalledWith(
			"light",
			"theme-test",
		);
	});

	test("handles different themes correctly", async () => {
		const mockNodeData: components["schemas"]["Node"] = {
			id: "multi-theme",
			title: "Multi Theme",
			raw: "Test content",
		};

		mockGET.mockResolvedValue({
			data: mockNodeData,
			error: undefined,
		});
		processorMocks.process.mockResolvedValue("Processed");

		// Test dark theme
		await openNode("dark", "multi-theme");
		expect(processorMocks.createOrgHtmlProcessor).toHaveBeenLastCalledWith(
			"dark",
			"multi-theme",
		);

		// Test light theme
		await openNode("light", "multi-theme");
		expect(processorMocks.createOrgHtmlProcessor).toHaveBeenLastCalledWith(
			"light",
			"multi-theme",
		);
	});

	test("preserves all node properties and adds body", async () => {
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
		processorMocks.process.mockResolvedValue(mockProcessedBody);

		const result = await openNode("dark", "comprehensive-node");

		expect(result).toEqual({
			id: "comprehensive-node",
			title: "Comprehensive Node",
			raw: "Raw org content",
			body: mockProcessedBody,
		});
	});

	test("module structure is correct", async () => {
		expect(openNode).toBeDefined();
		expect(typeof openNode).toBe("function");
	});
});
