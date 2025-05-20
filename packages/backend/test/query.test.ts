import { describe, expect, it, vi } from "vitest";

import { encodeBase64url } from "../src/base64url.ts";

let mockReadFile: ReturnType<typeof vi.fn>;
vi.mock("node:fs/promises", () => ({
	readFile: (...args: unknown[]) => mockReadFile(...args),
}));

const NODE_ID = "11111111-1111-4111-8111-111111111111";
const NODE_ID_2 = "22222222-2222-4222-8222-222222222222";

function makeGraphDb() {
	let call = 0;
	return {
		select: vi.fn(() => ({
			from: vi.fn(() => {
				call++;
				if (call === 1) return [{ id: NODE_ID, title: "t" }];
				return [
					{
						source: NODE_ID,
						dest: NODE_ID_2,
					},
					{ source: NODE_ID, dest: "bad" },
				];
			}),
		})),
	};
}

function makeNodeDb(row: { id: string; title: string; file: string }) {
	return {
		select: vi.fn(() => ({
			from: vi.fn(() => {
				const first = {
					innerJoin: vi.fn(() => first),
					where: vi.fn(() => first),
					get: vi.fn(() => row),
				};
				const second = {
					innerJoin: vi.fn(() => second),
					where: vi.fn(() => [{ source: "2", title: "back" }]),
				};
				if (!makeNodeDb.called) {
					makeNodeDb.called = true;
					return first;
				}
				return second;
			}),
		})),
	};
}
makeNodeDb.called = false as unknown as boolean;

function makeResourceDb(row: { id: string; title: string; file: string }) {
	return {
		select: vi.fn(() => ({
			from: vi.fn(() => {
				const chain = {
					innerJoin: vi.fn(() => chain),
					where: vi.fn(() => chain),
					get: vi.fn(() => row),
				};
				return chain;
			}),
		})),
	};
}

let mockCreateDatabase: ReturnType<typeof vi.fn>;
vi.mock("../src/database.ts", () => ({
	createDatabase: (...args: unknown[]) => mockCreateDatabase(...args),
}));

import { graph, node, resource } from "../src/query.ts";

mockReadFile = vi.fn();
mockCreateDatabase = vi.fn();

describe("graph", () => {
	it("filters invalid edges", async () => {
		mockCreateDatabase.mockResolvedValue(makeGraphDb());
		const result = await graph("x");
		const body = result[1].content["application/json"];
		expect(body.nodes).toHaveLength(1);
		expect(body.edges).toEqual([
			{
				source: NODE_ID,
				dest: NODE_ID_2,
			},
		]);
	});
});

describe("node", () => {
	it("returns node with backlinks and raw", async () => {
		mockReadFile.mockResolvedValue("ORG");
		makeNodeDb.called = false;
		mockCreateDatabase.mockResolvedValue(
			makeNodeDb({ id: NODE_ID, title: "t", file: "/tmp/a" }),
		);
		const result = await node("db", NODE_ID);
		type NodeBody = {
			id: string;
			title: string;
			raw: string;
			backlinks: { source: string; title: string }[];
		};
		const body = result[1].content["application/json"] as NodeBody;
		expect(body.id).toBe(NODE_ID);
		expect(body.backlinks[0].source).toBe("2");
		expect(body.raw).toBe("ORG");
	});
});

describe("resource", () => {
	it("reads resolved file", async () => {
		const row = { id: NODE_ID, title: "t", file: "/base/file.org" };
		mockCreateDatabase.mockResolvedValue(makeResourceDb(row));
		const encoded = encodeBase64url("images/foo");
		const full = `${encoded}.png`;
		const buf = new Uint8Array([1, 2]);
		mockReadFile.mockResolvedValue(buf);
		const result = await resource("db", NODE_ID, full);
		const body = (result[1].content as { [key: string]: Uint8Array })[
			"image/*"
		];
		expect(body).toBe(buf);
		expect(mockReadFile).toHaveBeenCalled();
	});
});
