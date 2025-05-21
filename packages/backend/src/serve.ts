import * as path from "node:path";
import process from "node:process";
import * as url from "node:url";
import { parseArgs } from "node:util";
import * as nodeServer from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { lookup } from "mime-types";
import { graph, node, resource } from "./query.ts";

export async function serve(db_path: string, port: number) {
	const frontendDistPath = path.relative(
		process.cwd(),
		path.join(import.meta.dirname ?? "", "../../frontend/dist"),
	);

	const app = new Hono();

	/* 静的ファイル (static/) */
	app.use(
		"/*",
		serveStatic({
			root: frontendDistPath,
		}),
	);

	/* ノード & エッジ一覧 */
	app.get("/api/graph.json", async (c) => {
		const [statusCode, response] = await graph(db_path);
		return c.json(response.content["application/json"], statusCode);
	});

	/* ノード詳細 + Org ソース */
	app.get("/api/node/:id", async (c) => {
		const id = c.req.param("id").replace(/\.json$/, "");
		const [statusCode, response] = await node(db_path, id);
		return c.json(response.content["application/json"], statusCode);
	});

	app.get("/api/node/:id/:encoded_path", async (c) => {
		const id = c.req.param("id");
		const encoded_path = c.req.param("encoded_path");
		const result = await resource(db_path, id, encoded_path);
		if (result[0] === 200) {
			return new Response(result[1].content["image/*"], {
				headers: {
					"Content-Type": lookup(encoded_path) || "application/octet-stream",
				},
			});
		} else {
			return c.json(result[1].content["application/json"], result[0]);
		}
	});

	console.log(`Launch at http://localhost:${port}/index.html`);
	nodeServer.serve({ fetch: app.fetch, port });
}

const isMain = process.argv[1] === url.fileURLToPath(import.meta.url);

if (isMain) {
	const args = parseArgs({
		options: {
			database: {
				type: "string",
				short: "d",
				default:
					process.env.DATABASE ?? `${process.env.HOME}/.emacs.d/org-roam.db`,
			},
			port: {
				type: "string",
				short: "p",
				default: process.env.PORT ?? "5174",
			},
		},
		allowPositionals: true,
	});

	await serve(args.values.database, Number(args.values.port));
}
