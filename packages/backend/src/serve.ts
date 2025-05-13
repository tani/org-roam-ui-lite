import * as fs from "node:fs/promises";
import * as path from "node:path";
import process from "node:process";
import * as nodeServer from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDatabase } from "./database.ts";
import { files, links, nodes } from "./schema.ts";

function isUuid(str: unknown): str is string {
	const UUID_REGEX =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return typeof str === "string" && UUID_REGEX.test(str);
}

export async function serve(db_path: string, port: number) {
	const db = await createDatabase(db_path);
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
		const [ns, es] = await Promise.all([
			db.select({ id: nodes.id, title: nodes.title }).from(nodes),
			db.select({ source: links.source, dest: links.dest }).from(links),
		]);

		const cleanNodes = ns.map((n) => ({
			id: n.id,
			title: n.title,
		}));

		// dest が UUID のみ許可
		const cleanEdges = es
			.filter((e) => isUuid(e.dest))
			.map(({ source, dest }) => ({ source: source, dest: dest }));

		return c.json({
			nodes: cleanNodes,
			edges: cleanEdges,
		});
	});

	/* ノード詳細 + Org ソース */
	app.get("/api/node/:id", async (c) => {
		const id = c.req.param("id").replace(/\.json$/, "");
		const row = db
			.select({ id: nodes.id, title: nodes.title, file: files.file })
			.from(nodes)
			.innerJoin(files, eq(nodes.file, files.file))
			.where(eq(nodes.id, `"${id}"`))
			.get();

		if (!row) return c.json({ error: "not_found" }, 404);

		const raw = await fs.readFile(row.file, "utf8");
		const backlinks = await db
			.select({
				source: links.source,
				title: nodes.title,
			})
			.from(links)
			.innerJoin(nodes, eq(links.source, nodes.id))
			.where(eq(links.dest, `"${id}"`));
		const cleanBacklinks = backlinks.map((node) => ({
			title: node.title,
			source: node.source,
		}));

		return c.json({
			id: row.id,
			title: row.title,
			raw,
			backlinks: cleanBacklinks,
		});
	});

	console.log(`Launch at http://localhost:${port}/index.html`);
	nodeServer.serve({ fetch: app.fetch, port });
}
