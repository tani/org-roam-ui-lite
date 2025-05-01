import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import rehypeStringfy from "rehype-stringify";
import { bundledLanguages, bundledThemes, createHighlighter } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { unified } from "unified";
import uniorgParse from "uniorg-parse";
import uniorgRehype from "uniorg-rehype";
import { db } from "./database.ts";
import { files, links, nodes } from "./schema.ts";

const highlighter = await createHighlighter({
	themes: Object.keys(bundledThemes),
	langs: Object.keys(bundledLanguages),
	engine: createJavaScriptRegexEngine({
		forgiving: true, // 互換性の問題を許容
	}),
});

const processor = unified()
	.use(uniorgParse)
	.use(uniorgRehype)
	.use(rehypeShikiFromHighlighter, highlighter, {
		theme: "vitesse-dark",
	})
	.use(rehypeStringfy);

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const clientDistPath = path.relative(
	process.cwd(),
	path.join(__dirname, "../../client/dist/"),
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
	const [ns, es] = await Promise.all([
		db
			.select({ id: nodes.id, title: nodes.title, file: nodes.file })
			.from(nodes),
		db.select({ source: links.source, dest: links.dest }).from(links),
	]);
	const cleanNodes = ns.map((n) => ({
		id: n.id,
		title: JSON.parse(n.title ?? ""),
		file: JSON.parse(n.file ?? ""),
	}));
	return c.json({ nodes: cleanNodes, edges: es });
});

/* ノード詳細 + Org ソース */
app.get("/api/node/:id", async (c) => {
	const id = c.req.param("id");
	const row = await db
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file))
		.where(eq(nodes.id, id))
		.get();

	if (!row) return c.json({ error: "not_found" }, 404);
	const cleanRow = {
		id: row.id,
		title: JSON.parse(row.title ?? ""),
		file: JSON.parse(row.file),
	};

	const raw = await fs.readFile(cleanRow.file, "utf8");
	const result = await processor.process(raw);
	const html = result.toString();
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

	return c.json({ ...cleanRow, html, backlinks: cleanBacklinks });
});

/* 起動 */
const port = Number(process.env.PORT) || 5174;
console.log(`Launch at http://localhost:${port}/index.html`);
serve({ fetch: app.fetch, port });
