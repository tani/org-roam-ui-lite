import { readFile } from "node:fs/promises";
import * as path from "node:path";
import process from "node:process";
import * as url from "node:url";
import { parseArgs } from "node:util";
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
	// Try to find index.html in multiple locations
	// 1. In the same directory as the bundled file (dist/)
	// 2. In the source structure (for dev)
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
			// Continue to next path
		}
	}

	if (indexHtml === undefined) {
		throw new Error(
			`Could not find index.html in any of: ${possiblePaths.join(", ")}`,
		);
	}

	const app = new Hono();

	/* Serve single-file HTML */
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
		} else {
			return context.json(result[1].content["application/json"], result[0]);
		}
	});

	console.log(`Launch at http://localhost:${port}/index.html`);
	nodeServer.serve({ fetch: app.fetch, port });
}

const isMain = process.argv[1] === url.fileURLToPath(import.meta.url);

if (isMain) {
	const args = parseArgs({
		options: {
			database: {
				type: "string",
				short: "d",
				default:
					process.env.DATABASE ?? `${process.env.HOME}/.emacs.d/org-roam.db`,
			},
			port: {
				type: "string",
				short: "p",
				default: process.env.PORT ?? "5174",
			},
		},
		allowPositionals: true,
	});

	await serve(args.values.database, Number(args.values.port));
}
