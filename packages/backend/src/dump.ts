// scripts/dump-json.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import process from "node:process";
import * as url from "node:url";
import { parseArgs } from "node:util";
import { eq } from "drizzle-orm";
import type { Element, Root } from "hast";
import raw from "rehype-raw";
import { unified } from "unified";
import parseOrg from "uniorg-parse";
import rehypeOrg from "uniorg-rehype";
import { visit } from "unist-util-visit";
import { encodeBase64url } from "./base64url.ts";
import { createDatabase } from "./database.ts";
import { files, links, nodes } from "./schema.ts";

function isUuid(str: unknown): str is string {
	const UUID_REGEX =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return typeof str === "string" && UUID_REGEX.test(str);
}

async function dumpGraphJson(db_path: string, out_path: string) {
	const db = await createDatabase(db_path);
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

	await fs.mkdir(out_path, { recursive: true });
	await fs.writeFile(
		path.join(out_path, "graph.json"),
		JSON.stringify({ nodes: cleanNodes, edges: cleanEdges }, null, 2),
	);
}

async function dumpNodeJsons(db_path: string, out_path: string) {
	const db = await createDatabase(db_path);

	// unified パイプラインを一度だけ組んでおく
	const processor = unified()
		.use(parseOrg) // org テキスト → MDAST
		.use(rehypeOrg) // MDAST → HAST
		.use(raw); // HAST 中の HTML を展開

	const allNodes = await db
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file));

	for (const row of allNodes) {
		const id = row.id;
		const rawText = await fs.readFile(row.file, "utf8");

		// 1) 通常の node.json ダンプ
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
			raw: rawText,
			backlinks: cleanBacklinks,
		};

		const nodeDir = path.join(out_path, "node");
		await fs.mkdir(nodeDir, { recursive: true });
		await fs.writeFile(
			path.join(nodeDir, `${id}.json`),
			JSON.stringify(nodeJson, null, 2),
		);

		const parsed = processor.parse(rawText);
		// @ts-ignore: unified@10+ の run は Node を返します
		const tree = (await processor.run(parsed)) as Root;

		const imgSrcs: string[] = [];
		visit(tree, "element", (node: Element) => {
			if (node.tagName === "img" && typeof node.properties?.src === "string") {
				const src: string = node.properties.src;
				if (
					src.startsWith("data:") ||
					src.startsWith("http:") ||
					src.startsWith("https:") ||
					src.startsWith("//")
				)
					return;
				imgSrcs.push(src);
			}
		});

		// 重複排除
		const uniqueSrcs = Array.from(new Set(imgSrcs));
		const basePath = path.dirname(row.file);

		for (const src of uniqueSrcs) {
			const ext = path.extname(src);
			const basename = path.basename(src, ext);
			const encoded = encodeBase64url(basename);

			const srcPath = path.resolve(basePath, src);
			const destDir = path.join(out_path, "node", id);
			const destFile = path.join(destDir, `${encoded}${ext}`);

			await fs.mkdir(destDir, { recursive: true });
			await fs.copyFile(srcPath, destFile);
		}
	}
}

export async function dump(db_path: string, out_path: string) {
	await dumpGraphJson(db_path, out_path);
	await dumpNodeJsons(db_path, out_path);
	console.log(`✅ All JSON files dumped to ${out_path}`);
}

const isMain = process.argv[1] === url.fileURLToPath(import.meta.url);

if (isMain) {
	const args = parseArgs({
		options: {
			output: {
				type: "string",
				short: "o",
				default: process.env.OUTPUT ?? `${process.cwd()}/dist`,
			},
			database: {
				type: "string",
				short: "d",
				default: process.env.DATABASE ?? `${process.cwd()}/database.db`,
			},
		},
		allowPositionals: true,
	});

	await dump(args.values.database, args.values.output);
}
