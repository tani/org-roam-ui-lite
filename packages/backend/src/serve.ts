import { readFile } from "node:fs/promises";
import * as path from "node:path";
import process from "node:process";
import * as nodeServer from "@hono/node-server";
import { Hono } from "hono";
import { lookup } from "mime-types";
import { fetchGraph, fetchNode, fetchResource } from "./query.ts";

/**
 * Start the HTTP server serving the front-end and API.
 *
 * @param databasePath - Path to the database
 * @param port - TCP port to listen on
 */
export async function serve(databasePath: string, port: number): Promise<void> {
	const possiblePaths: string[] = [];
	if (process.argv[1]) {
		possiblePaths.push(path.join(path.dirname(process.argv[1]), "index.html"));
	}
	possiblePaths.push(
		path.join(import.meta.dirname ?? "", "../../frontend/dist/index.html"),
	);

	let indexHtml: string | undefined;

	for (const candidatePath of possiblePaths) {
		try {
			indexHtml = await readFile(candidatePath, "utf-8");
			break;
		} catch {
			// empty — try next candidate
		}
	}

	if (indexHtml === undefined) {
		throw new Error(
			`Could not find index.html in any of: ${possiblePaths.join(", ")}`,
		);
	}

	const app = new Hono();

	app.get("/", (context) => {
		return context.html(indexHtml);
	});

	app.get("/index.html", (context) => {
		return context.html(indexHtml);
	});

	/* Node and edge list */
	app.get("/api/graph.json", async (context) => {
		const [statusCode, response] = await fetchGraph(databasePath);
		return context.json(response.content["application/json"], statusCode);
	});

	/* Node details including Org source */
	app.get("/api/node/:id", async (context) => {
		const nodeId = context.req.param("id").replace(/\.json$/, "");
		const [statusCode, response] = await fetchNode(databasePath, nodeId);
		return context.json(response.content["application/json"], statusCode);
	});

	app.get("/api/node/:id/:encoded_path", async (context) => {
		const nodeId = context.req.param("id");
		const encodedPath = context.req.param("encoded_path");
		const result = await fetchResource(databasePath, nodeId, encodedPath);
		if (result[0] === 200) {
			return new Response(result[1].content["image/*"] as BodyInit, {
				headers: {
					"Content-Type": lookup(encodedPath) || "application/octet-stream",
				},
			});
		}
		return context.json(result[1].content["application/json"], result[0]);
	});

	console.log(`Launch at http://localhost:${port}/index.html`);
	nodeServer.serve({ fetch: app.fetch, port });
}
