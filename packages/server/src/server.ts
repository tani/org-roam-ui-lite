import * as fs from "node:fs/promises";
import * as path from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { args } from "./args.ts";
import { createDatabase } from "./database.ts";
import { files, links, nodes } from "./schema.ts";

const clientDistPath = path.relative(
	process.cwd(),
	path.join(import.meta.dirname!, "../../client/dist/"),
);

const app = new Hono();

/* 静的ファイル (static/) */
app.use(
	"/*",
	serveStatic({
		root: clientDistPath,
	}),
);

/* ノード & エッジ一覧 */
app.get("/api/graph", async (c) => {
	const db = await createDatabase();
	const [ns, es] = await Promise.all([
		db.select({ id: nodes.id, title: nodes.title }).from(nodes),
		db.select({ source: links.source, dest: links.dest }).from(links),
	]);
	const cleanNodes = ns.map((n) => ({
		id: n.id,
		title: JSON.parse(n.title ?? ""),
	}));
	return c.json({ nodes: cleanNodes, edges: es });
});

/* ノード詳細 + Org ソース */
app.get("/api/node/:id", async (c) => {
	const db = await createDatabase();
	const id = c.req.param("id");
	const row = db
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file))
		.where(eq(nodes.id, id))
		.get();

	if (!row) return c.json({ error: "not_found" }, 404);

	const raw = await fs.readFile(JSON.parse(row.file), "utf8");
	const backlinks = await db
		.select({
			source: links.source,
			title: nodes.title,
		})
		.from(links)
		.innerJoin(nodes, eq(links.source, nodes.id))
		.where(eq(links.dest, id));
	const cleanBacklinks = backlinks.map((node) => ({
		title: JSON.parse(node.title ?? ""),
		source: node.source,
	}));

	return c.json({
		id: row.id,
		title: JSON.parse(row.title ?? ""),
		raw,
		backlinks: cleanBacklinks,
	});
});

/* 起動 */
const port = Number(args.values.port) || Number(process.env.PORT) || 5174;
console.log(`Launch at http://localhost:${port}/index.html`);
serve({ fetch: app.fetch, port });
