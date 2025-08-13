import { beforeEach, describe, expect, it, vi } from "vitest";

const use = vi.fn();
const get = vi.fn();
class Hono {
	use = use;
	get = get;
	fetch = "fetch";
}
vi.mock("hono", () => ({ Hono }));

const serveStatic = vi.fn();
vi.mock("@hono/node-server/serve-static", () => ({
	serveStatic: (...args: unknown[]) => serveStatic(...args),
}));

const serveImpl = vi.fn();
vi.mock("@hono/node-server", () => ({
	serve: (options: unknown) => serveImpl(options),
}));

const fetchGraph = vi.fn(async () => [
	200,
	{ content: { "application/json": {} } },
]);
const fetchNode = vi.fn(async () => [
	200,
	{ content: { "application/json": {} } },
]);
const fetchResource = vi.fn(async () => [
	200,
	{ content: { "application/json": { error: "not_found" } } },
]);
vi.mock("../src/query.ts", () => ({ fetchGraph, fetchNode, fetchResource }));

beforeEach(() => {
	use.mockClear();
	get.mockClear();
	serveImpl.mockClear();
	fetchGraph.mockClear();
	fetchNode.mockClear();
	fetchResource.mockClear();
	vi.resetModules();
});

describe("serve", () => {
	it("registers routes and handles requests", async () => {
		const { serve } = await import("../src/serve.ts");
		await serve("db", 123);
		expect(use).toHaveBeenCalled();
		expect(get).toHaveBeenCalledTimes(3);
		expect(serveImpl).toHaveBeenCalledWith({ fetch: "fetch", port: 123 });

		const graphHandler = get.mock.calls[0]?.[1];
		const graphCtx = { json: vi.fn(), req: { param: vi.fn() } };
		await graphHandler(graphCtx as never);
		expect(fetchGraph).toHaveBeenCalledWith("db");
		expect(graphCtx.json).toHaveBeenCalledWith({}, 200);

		const nodeHandler = get.mock.calls[1]?.[1];
		const nodeCtx = {
			json: vi.fn(),
			req: { param: vi.fn(() => "id.json") },
		};
		await nodeHandler(nodeCtx as never);
		expect(fetchNode).toHaveBeenCalledWith("db", "id");

		const resHandler = get.mock.calls[2]?.[1];
		const resCtxOk = {
			req: { param: vi.fn((n) => (n === "id" ? "1" : "pic.png")) },
			json: vi.fn(),
		};
		fetchResource.mockResolvedValueOnce([
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
		fetchResource.mockResolvedValueOnce([
			404,
			{ content: { "application/json": { error: "not_found" } } },
		] as never);
		await resHandler(resCtxBad);
		expect(resCtxBad.json).toHaveBeenCalledWith({ error: "not_found" }, 404);
	});

	it("runs CLI when executed directly", async () => {
		process.argv[1] = new URL("../src/serve.ts", import.meta.url).pathname;
		await import("../src/serve.ts");
		expect(serveImpl).toHaveBeenCalled();
	});
});
