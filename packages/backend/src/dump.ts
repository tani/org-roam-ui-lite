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
import { graph, node } from "./query.ts";
import { files, nodes } from "./schema.ts";

async function dumpGraphJson(db_path: string, out_path: string) {
	const [_statusCode, response] = await graph(db_path);

	await fs.mkdir(out_path, { recursive: true });
	await fs.writeFile(
		path.join(out_path, "graph.json"),
		JSON.stringify(response.content["application/json"], null, 2),
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

		const [_statusCode, response] = await node(db_path, id);

		const nodeDir = path.join(out_path, "node");
		await fs.mkdir(nodeDir, { recursive: true });
		await fs.writeFile(
			path.join(nodeDir, `${id}.json`),
			JSON.stringify(response.content["application/json"], null, 2),
		);

		const json = response.content["application/json"];
		if ("raw" in json) {
			const parsed = processor.parse(json.raw);
			// unified@10+ run returns Node, but our pipeline yields a HAST Root
			const tree = (await processor.run(parsed)) as unknown as Root;

			const imgSrcs: string[] = [];
			visit(tree, "element", (node: Element) => {
				if (
					node.tagName === "img" &&
					typeof node.properties?.src === "string"
				) {
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
				default:
					process.env.DATABASE ?? `${process.env.HOME}/.emacs.d/org-roam.db`,
			},
		},
		allowPositionals: true,
	});

	await dump(args.values.database, args.values.output);
}
