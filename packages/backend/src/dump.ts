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
import { fetchGraph, fetchNode } from "./query.ts";
import { files, nodes } from "./schema.ts";

/**
 * Write graph.json representing all nodes and edges.
 *
 * @param databasePath - Path to the database
 * @param outputPath - Directory for the output file
 */
async function dumpGraphJson(
	databasePath: string,
	outputPath: string,
): Promise<void> {
	const [_statusCode, response] = await fetchGraph(databasePath);

	await fs.mkdir(outputPath, { recursive: true });
	await fs.writeFile(
		path.join(outputPath, "graph.json"),
		JSON.stringify(response.content["application/json"], null, 2),
	);
}

/**
 * Dump each node as an individual JSON file and copy referenced images.
 *
 * @param databasePath - Path to the database
 * @param outputPath - Directory where the files will be written
 */
async function dumpNodeJsons(
	databasePath: string,
	outputPath: string,
): Promise<void> {
	const database = await createDatabase(databasePath);

	// Build the unified pipeline once
	const processor = unified()
		.use(parseOrg) // org text -> MDAST
		.use(rehypeOrg) // MDAST -> HAST
		.use(raw); // Expand HTML within HAST

	const allNodes = await database
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file));

	for (const row of allNodes) {
		const id = row.id;

		const [_statusCode, response] = await fetchNode(databasePath, id);

		const nodeDir = path.join(outputPath, "node");
		await fs.mkdir(nodeDir, { recursive: true });
		await fs.writeFile(
			path.join(nodeDir, `${id}.json`),
			JSON.stringify(response.content["application/json"], null, 2),
		);

		const json = response.content["application/json"];
		if ("raw" in json) {
			const parsed = processor.parse(json.raw);
			// unified@10+ run returns Node, but our pipeline yields a HAST Root
			const tree = (await processor.run(parsed)) as Root;

			const imageSources: string[] = [];
			visit(tree, "element", (node: Element) => {
				if (
					node.tagName === "img" &&
					typeof node.properties?.src === "string"
				) {
					const sourcePath: string = node.properties.src;
					if (
						sourcePath.startsWith("data:") ||
						sourcePath.startsWith("http:") ||
						sourcePath.startsWith("https:") ||
						sourcePath.startsWith("//")
					)
						return;
					imageSources.push(sourcePath);
				}
			});

			// Remove duplicates
			const uniqueSources = Array.from(new Set(imageSources));
			const basePath = path.dirname(row.file);

			for (const sourcePath of uniqueSources) {
				const ext = path.extname(sourcePath);
				const baseName = path.basename(sourcePath, ext);
				const encoded = encodeBase64url(baseName);
				const sourceFilePath = path.resolve(basePath, sourcePath);
				const destDir = path.join(outputPath, "node", id);
				const destFile = path.join(destDir, `${encoded}${ext}`);

				await fs.mkdir(destDir, { recursive: true });
				await fs.copyFile(sourceFilePath, destFile);
			}
		}
	}
}

/**
 * Dump graph and node data to JSON files under the given directory.
 *
 * @param databasePath - Path to the database
 * @param outputPath - Directory where files are written
 */
export async function dump(
	databasePath: string,
	outputPath: string,
): Promise<void> {
	await dumpGraphJson(databasePath, outputPath);
	await dumpNodeJsons(databasePath, outputPath);
	console.log(`✅ All JSON files dumped to ${outputPath}`);
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
