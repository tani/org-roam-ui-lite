import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to define mocks
const { mocks } = vi.hoisted(() => ({
	mocks: {
		use: vi.fn(),
		get: vi.fn(),
		serveImpl: vi.fn(),
		serveStatic: vi.fn(),
		readFile: vi.fn(async () => "<html>test</html>"),
		fetchGraph: vi.fn(async () => [
			200,
			{ content: { "application/json": {} } },
		]),
		fetchNode: vi.fn(async () => [
			200,
			{ content: { "application/json": {} } },
		]),
		fetchResource: vi.fn(async () => [
			200,
			{ content: { "application/json": { error: "not_found" } } },
		]),
	},
}));

vi.mock("hono", () => {
	class Hono {
		use = mocks.use;
		get = mocks.get;
		fetch = "fetch";
	}
	return { Hono };
});

vi.mock("@hono/node-server/serve-static", () => ({
	serveStatic: (...args: unknown[]) => mocks.serveStatic(...args),
}));

vi.mock("@hono/node-server", () => ({
	serve: (options: unknown) => mocks.serveImpl(options),
}));

vi.mock("node:fs/promises", () => ({
	readFile: mocks.readFile,
}));

vi.mock("../src/query.ts", () => ({
	fetchGraph: mocks.fetchGraph,
	fetchNode: mocks.fetchNode,
	fetchResource: mocks.fetchResource,
}));

import { serve } from "../src/serve.ts";

beforeEach(() => {
	mocks.use.mockClear();
	mocks.get.mockClear();
	mocks.serveImpl.mockClear();
	mocks.readFile.mockClear();
	mocks.fetchGraph.mockClear();
	mocks.fetchNode.mockClear();
	mocks.fetchResource.mockClear();
});

describe("serve", () => {
	it("registers routes and handles requests", async () => {
		await serve("db", 123);
		expect(mocks.get).toHaveBeenCalledTimes(5);
		expect(mocks.serveImpl).toHaveBeenCalledWith({ fetch: "fetch", port: 123 });

		// Test HTML endpoints (/, /index.html)
		const htmlHandler = mocks.get.mock.calls[0]?.[1];
		const htmlCtx = { html: vi.fn() };
		await htmlHandler(htmlCtx as never);
		expect(htmlCtx.html).toHaveBeenCalled();

		// Test graph endpoint
		const graphHandler = mocks.get.mock.calls[2]?.[1];
		const graphCtx = { json: vi.fn(), req: { param: vi.fn() } };
		await graphHandler(graphCtx as never);
		expect(mocks.fetchGraph).toHaveBeenCalledWith("db");
		expect(graphCtx.json).toHaveBeenCalledWith({}, 200);

		const nodeHandler = mocks.get.mock.calls[3]?.[1];
		const nodeCtx = {
			json: vi.fn(),
			req: { param: vi.fn(() => "id.json") },
		};
		await nodeHandler(nodeCtx as never);
		expect(mocks.fetchNode).toHaveBeenCalledWith("db", "id");

		const resHandler = mocks.get.mock.calls[4]?.[1];
		const resCtxOk = {
			req: { param: vi.fn((n) => (n === "id" ? "1" : "pic.png")) },
			json: vi.fn(),
		};
		mocks.fetchResource.mockResolvedValueOnce([
			200,
			{ content: { "image/*": new Uint8Array([1, 2]) } },
		] as never);
		const response = await resHandler(resCtxOk);
		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get("Content-Type")).toBe("image/png");

		const resCtxBad = {
			req: { param: vi.fn((n) => (n === "id" ? "1" : "pic.png")) },
			json: vi.fn(),
		};
		mocks.fetchResource.mockResolvedValueOnce([
			404,
			{ content: { "application/json": { error: "not_found" } } },
		] as never);
		await resHandler(resCtxBad);
		expect(resCtxBad.json).toHaveBeenCalledWith({ error: "not_found" }, 404);
	});

	it("calls serve when invoked", async () => {
		await serve("test-db", 9999);
		expect(mocks.serveImpl).toHaveBeenCalled();
	});
});
