import * as path from "node:path";
import process from "node:process";
import * as url from "node:url";
import { parseArgs } from "node:util";
import * as nodeServer from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
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
  const frontendDistPath = path.relative(
    process.cwd(),
    path.join(import.meta.dirname ?? "", "../../frontend/dist"),
  );

  const app = new Hono();

  /* Static files (frontend) */
  app.use(
    "/*",
    serveStatic({
      root: frontendDistPath,
    }),
  );

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
      return new Response(result[1].content["image/*"], {
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
