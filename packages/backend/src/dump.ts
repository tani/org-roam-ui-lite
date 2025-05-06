// scripts/dump-json.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "./database.ts";
import { files, links, nodes } from "./schema.ts";
import { args } from "./args.ts";

const outDir = args.values.output;

function isUuid(str: unknown): str is string {
	const UUID_REGEX =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return typeof str === "string" && UUID_REGEX.test(str);
}

async function dumpGraphJson() {
	const [ns, es] = await Promise.all([
		db.select({ id: nodes.id, title: nodes.title }).from(nodes),
		db.select({ source: links.source, dest: links.dest }).from(links),
	]);

	const cleanNodes = ns.map((n) => ({
		id: n.id,
		title: n.title,
	}));

	const cleanEdges = es
		.filter((e) => isUuid(e.dest))
		.map(({ source, dest }) => ({
			source,
			dest,
		}));

	await fs.mkdir(outDir, { recursive: true });
	await fs.writeFile(
		path.join(outDir, "graph.json"),
		JSON.stringify({ nodes: cleanNodes, edges: cleanEdges }, null, 2),
	);
}

async function dumpNodeJsons() {
	const allNodes = await db
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file));

	for (const row of allNodes) {
		const id = row.id;
		const raw = await fs.readFile(row.file, "utf8");

		const backlinks = await db
			.select({
				source: links.source,
				title: nodes.title,
			})
			.from(links)
			.innerJoin(nodes, eq(links.source, nodes.id))
			.where(eq(links.dest, `"${id}"`));

		const cleanBacklinks = backlinks.map((b) => ({
			title: b.title,
			source: b.source,
		}));

		const nodeJson = {
			id,
			title: row.title,
			raw,
			backlinks: cleanBacklinks,
		};
		await fs.mkdir(path.join(outDir, "node"), { recursive: true });
		await fs.writeFile(
			path.join(outDir, `node/${id}.json`),
			JSON.stringify(nodeJson, null, 2),
		);
	}
}

export async function dump() {
	await dumpGraphJson();
	await dumpNodeJsons();
	console.log(`✅ All JSON files dumped to ${outDir}`);
}
