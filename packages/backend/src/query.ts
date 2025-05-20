import * as fs from "node:fs/promises";
import * as path from "node:path";
import { eq } from "drizzle-orm";
import type { paths } from "./api.d.ts";
import { createDatabase } from "./database.ts";
import { files, links, nodes } from "./schema.ts";

function isUuid(str: unknown): str is string {
	const UUID_REGEX =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return typeof str === "string" && UUID_REGEX.test(str);
}

type KVPair<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

type GraphResponse = KVPair<paths["/api/graph.json"]["get"]["responses"]>;
export async function graph(db_path: string): Promise<GraphResponse> {
	const db = await createDatabase(db_path);
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

	return [
		200,
		{
			headers: {},
			content: {
				"application/json": {
					nodes: cleanNodes,
					edges: cleanEdges,
				},
			},
		},
	];
}

type NodeResponse = KVPair<paths["/api/node/{id}.json"]["get"]["responses"]>;
export async function node(db_path: string, id: string): Promise<NodeResponse> {
	const db = await createDatabase(db_path);
	const row = db
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file))
		.where(eq(nodes.id, `"${id}"`))
		.get();

	if (!row)
		return [
			404,
			{
				headers: {},
				content: {
					"application/json": {
						error: "not_found",
					},
				},
			},
		];

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

	return [
		200,
		{
			headers: {},
			content: {
				"application/json": {
					id: row.id,
					title: row.title,
					raw,
					backlinks: cleanBacklinks,
				},
			},
		},
	];
}

type ResourceResponse = KVPair<
	paths["/api/node/{id}/{path}"]["get"]["responses"]
>;
export async function resource(
	db_path: string,
	id: string,
	encoded_path: string,
): Promise<ResourceResponse> {
	const db = await createDatabase(db_path);
	const row = db
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file))
		.where(eq(nodes.id, `"${id}"`))
		.get();

	if (!row)
		return [
			404,
			{
				headers: {},
				content: {
					"application/json": {
						error: "not_found",
					},
				},
			},
		];

	const basePath = path.dirname(row.file);
	const { ext, name } = path.parse(encoded_path);
	const decodedBasename = Buffer.from(name, "base64").toString("utf8");
	const filePath = `${decodedBasename}${ext}`;
	const resolvedPath = path.resolve(basePath, filePath);

	const buffer = await fs.readFile(resolvedPath);

	return [
		200,
		{
			headers: {},
			content: {
				"image/*": buffer,
			},
		},
	];
}
