import { readFile } from "node:fs/promises";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "./database.ts";
import { files, links, nodes } from "./schema.ts";

const app = new Hono();

/* 静的ファイル (static/) */
app.use("/client/*", serveStatic({root: "dist/"}));


/* ノード & エッジ一覧 */
app.get("/graph", async (c) => {
	const [ns, es] = await Promise.all([
		db.select({ id: nodes.id, title: nodes.title }).from(nodes),
		db.select({ source: links.source, dest: links.dest }).from(links),
	]);
	return c.json({ nodes: ns, edges: es });
});

/* ノード詳細 + Org ソース */
app.get("/node/:id", async (c) => {
	const id = c.req.param("id");
	const row = await db
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file))
		.where(eq(nodes.id, id))
		.get();

	if (!row) return c.json({ error: "not_found" }, 404);

	const raw = await readFile(JSON.parse(row.file), "utf8");
	const backlinks = await db
		.select({ source: links.source })
		.from(links)
		.where(eq(links.dest, id));

	return c.json({ ...row, raw, backlinks });
});

/* 起動 */
const port = Number(process.env.PORT) || 5174;
console.log(`Launch at http://localhost:${port}/client/index.html`);
serve({ fetch: app.fetch, port });
