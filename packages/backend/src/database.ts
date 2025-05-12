import * as fs from "node:fs/promises";
import { drizzle } from "drizzle-orm/sql-js";
import type { SqlJsStatic } from "sql.js";
import initSqlJs from "sql.js";
import { args } from "./args.ts";
import * as schema from "./schema.ts";

let SQL: SqlJsStatic;

try {
	// @ts-ignore: esbuild
	const { default: wasmURL } = await import("sql.js/dist/sql-wasm.wasm");
	SQL = await initSqlJs({ locateFile: () => wasmURL });
} catch {
	SQL = await initSqlJs();
}

const database = new SQL.Database(
	new Uint8Array(await fs.readFile(args.values.database)),
);

export const db = drizzle(database, { schema });
