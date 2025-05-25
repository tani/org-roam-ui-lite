import * as fs from "node:fs/promises";
import * as path from "node:path";
import { eq } from "drizzle-orm";
import type { paths } from "./api.d.ts";
import { createDatabase } from "./database.ts";
import { files, links, nodes } from "./schema.ts";

/**
 * Check whether the given value is a UUID string.
 *
 * @param str - Value to test
 * @returns True if the value matches UUID format
 */
function isUuid(str: unknown): str is string {
	const UUID_REGEX =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return typeof str === "string" && UUID_REGEX.test(str);
}

type KVPair<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

type GraphResponse = KVPair<paths["/api/graph.json"]["get"]["responses"]>;

/**
 * Return the entire graph as nodes and edges.
 *
 * @param databasePath - Path to the database
 */
export async function fetchGraph(databasePath: string): Promise<GraphResponse> {
	const database = await createDatabase(databasePath);
	const [nodeRows, edgeRows] = await Promise.all([
		database.select({ id: nodes.id, title: nodes.title }).from(nodes),
		database.select({ source: links.source, dest: links.dest }).from(links),
	]);

	const cleanNodes = nodeRows.map((nodeRow) => ({
		id: nodeRow.id,
		title: nodeRow.title,
	}));

	// Only allow edges whose dest is a valid UUID
	const cleanEdges = edgeRows
		.filter((edge) => isUuid(edge.dest))
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

/**
 * Fetch a single node and its backlinks.
 *
 * @param databasePath - Path to the database
 * @param nodeId - Node identifier
 */
export async function fetchNode(
	databasePath: string,
	nodeId: string,
): Promise<NodeResponse> {
	const database = await createDatabase(databasePath);
	const row = database
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file))
		.where(eq(nodes.id, `"${nodeId}"`))
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
	const backlinks = await database
		.select({
			source: links.source,
			title: nodes.title,
		})
		.from(links)
		.innerJoin(nodes, eq(links.source, nodes.id))
		.where(eq(links.dest, `"${nodeId}"`));
	const cleanBacklinks = backlinks.map((backlink) => ({
		title: backlink.title,
		source: backlink.source,
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
/**
 * Serve a binary resource attached to a node.
 *
 * @param databasePath - Path to the database
 * @param nodeId - Node identifier
 * @param encodedPath - Base64url encoded file name
 */
export async function fetchResource(
	databasePath: string,
	nodeId: string,
	encodedPath: string,
): Promise<ResourceResponse> {
	const database = await createDatabase(databasePath);
	const row = database
		.select({ id: nodes.id, title: nodes.title, file: files.file })
		.from(nodes)
		.innerJoin(files, eq(nodes.file, files.file))
		.where(eq(nodes.id, `"${nodeId}"`))
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
	const { ext, name } = path.parse(encodedPath);
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
