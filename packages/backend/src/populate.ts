import * as fs from "node:fs/promises";
import * as path from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import * as url from "node:url";
import { parseArgs } from "node:util";
import { drizzle } from "drizzle-orm/node-sqlite";
import { files, links, nodes } from "./schema.ts";

interface OrgNode {
	id: string;
	file: string;
	title: string;
	pos: number;
}

interface OrgFile {
	file: string;
	title: string;
	content: string;
	nodes: OrgNode[];
}

interface PopulateResult {
	files: number;
	nodes: number;
	links: number;
}

const ORG_FILE_EXTENSION = ".org";

function jsonText(value: string): string {
	return JSON.stringify(value);
}

async function walkOrgFiles(directory: string): Promise<string[]> {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);
			if (entry.isDirectory()) return walkOrgFiles(entryPath);
			if (entry.isFile() && entry.name.endsWith(ORG_FILE_EXTENSION)) {
				return [entryPath];
			}
			return [];
		}),
	);

	return nested.flat().sort();
}

function cleanHeadlineTitle(value: string): string {
	return value
		.replace(/^\s*(TODO|DONE|NEXT|WAIT|CANCELLED)\s+/i, "")
		.replace(/\s+:[\w:@#%]+:\s*$/u, "")
		.trim();
}

function titleAt(content: string, position: number, fileTitle: string): string {
	const before = content.slice(0, position);
	const headlines = [...before.matchAll(/^\*+\s+(.+)$/gm)];
	const lastHeadline = headlines.at(-1);
	if (lastHeadline?.[1]) return cleanHeadlineTitle(lastHeadline[1]);
	return fileTitle;
}

function extractFileTitle(content: string, filePath: string): string {
	const title = content.match(/^#\+title:\s*(.+)$/im)?.[1]?.trim();
	return title || path.basename(filePath, ORG_FILE_EXTENSION);
}

function maskIgnoredBlocks(content: string): string {
	return content.replace(
		/^#\+begin_(src|example|comment)\b[\s\S]*?^#\+end_\1\s*$/gim,
		(match) => " ".repeat(match.length),
	);
}

function extractNodes(
	filePath: string,
	content: string,
	fileTitle: string,
): OrgNode[] {
	const nodes: OrgNode[] = [];
	const seen = new Set<string>();
	const drawerMatches = content.matchAll(
		/^\s*:PROPERTIES:\s*$[\s\S]*?^\s*:END:\s*$/gim,
	);

	for (const drawerMatch of drawerMatches) {
		const drawer = drawerMatch[0];
		const id = drawer.match(/^\s*:ID:\s*(\S+)\s*$/im)?.[1];
		if (!id || seen.has(id)) continue;
		seen.add(id);
		const pos = drawerMatch.index ?? 0;
		nodes.push({
			id,
			file: filePath,
			title: titleAt(content, pos, fileTitle),
			pos,
		});
	}

	return nodes.sort((a, b) => a.pos - b.pos);
}

function sourceNodeForLink(
	nodes: OrgNode[],
	position: number,
): OrgNode | undefined {
	let source = nodes[0];
	for (const node of nodes) {
		if (node.pos > position) break;
		source = node;
	}
	return source;
}

function extractLinks(orgFiles: OrgFile[], knownNodeIds: Set<string>) {
	const links: { source: string; dest: string }[] = [];
	const seen = new Set<string>();

	for (const orgFile of orgFiles) {
		const linkableContent = maskIgnoredBlocks(orgFile.content);
		for (const match of linkableContent.matchAll(
			/\[\[id:([^\][]+)\](?:\[[^\]]*\])?\]|(?<![[\w-])id:([^\s\]]+)/g,
		)) {
			const dest = match[1] ?? match[2];
			const source = sourceNodeForLink(orgFile.nodes, match.index ?? 0);
			if (!source || !dest || !knownNodeIds.has(dest)) continue;
			const key = `${source.id}\0${dest}`;
			if (seen.has(key)) continue;
			seen.add(key);
			links.push({ source: source.id, dest });
		}
	}

	return links;
}

function createSchema(sqlite: DatabaseSync): void {
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS files (
			file TEXT PRIMARY KEY,
			title TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS nodes (
			id TEXT PRIMARY KEY,
			file TEXT NOT NULL REFERENCES files(file),
			title TEXT NOT NULL,
			pos INTEGER NOT NULL
		);
		CREATE TABLE IF NOT EXISTS links (
			source TEXT NOT NULL REFERENCES nodes(id),
			dest TEXT NOT NULL REFERENCES nodes(id)
		);
	`);
}

/**
 * Populate a minimal Org-roam-compatible SQLite database from a directory of
 * .org files.
 *
 * @param orgDirectory - Directory containing Org-roam files
 * @param databasePath - SQLite database path to create or replace
 */
export async function populate(
	orgDirectory: string,
	databasePath: string,
): Promise<PopulateResult> {
	const root = path.resolve(orgDirectory);
	const output = path.resolve(databasePath);
	const orgPaths = await walkOrgFiles(root);
	const orgFiles = await Promise.all(
		orgPaths.map(async (filePath) => {
			const content = await fs.readFile(filePath, "utf8");
			const title = extractFileTitle(content, filePath);
			return {
				file: filePath,
				title,
				content,
				nodes: extractNodes(filePath, content, title),
			};
		}),
	);
	const allNodes = orgFiles.flatMap((orgFile) => orgFile.nodes);
	const knownNodeIds = new Set(allNodes.map((node) => node.id));
	const allLinks = extractLinks(orgFiles, knownNodeIds);

	await fs.mkdir(path.dirname(output), { recursive: true });
	const sqlite = new DatabaseSync(output);
	const database = drizzle({ client: sqlite });

	try {
		createSchema(sqlite);

		database.transaction((transaction) => {
			transaction.delete(links).run();
			transaction.delete(nodes).run();
			transaction.delete(files).run();

			for (const orgFile of orgFiles) {
				if (orgFile.nodes.length === 0) continue;
				transaction
					.insert(files)
					.values({
						file: jsonText(orgFile.file),
						title: jsonText(orgFile.title),
					})
					.run();
				for (const node of orgFile.nodes) {
					transaction
						.insert(nodes)
						.values({
							id: jsonText(node.id),
							file: jsonText(node.file),
							title: jsonText(node.title),
							pos: node.pos,
						})
						.run();
				}
			}
			for (const link of allLinks) {
				transaction
					.insert(links)
					.values({
						source: jsonText(link.source),
						dest: jsonText(link.dest),
					})
					.run();
			}
		});
	} finally {
		sqlite.close();
	}

	const result = {
		files: orgFiles.filter((orgFile) => orgFile.nodes.length > 0).length,
		nodes: allNodes.length,
		links: allLinks.length,
	};
	console.log(
		`Populated ${result.nodes} nodes and ${result.links} links from ${result.files} files into ${output}`,
	);
	return result;
}

const isMain = process.argv[1] === url.fileURLToPath(import.meta.url);

if (isMain) {
	const args = parseArgs({
		options: {
			input: {
				type: "string",
				short: "i",
				default: process.env.ORG_ROAM_DIRECTORY ?? process.cwd(),
			},
			database: {
				type: "string",
				short: "d",
				default: process.env.DATABASE ?? `${process.cwd()}/org-roam.db`,
			},
		},
		allowPositionals: true,
	});

	await populate(args.values.input, args.values.database);
}
