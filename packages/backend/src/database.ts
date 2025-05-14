import * as fs from "node:fs/promises";
import { drizzle, SQLJsDatabase } from "drizzle-orm/sql-js";
import type { SqlJsStatic } from "sql.js";
import initSqlJs from "sql.js";
import * as schema from "./schema.ts";

export type Database = SQLJsDatabase<typeof schema>;
export async function createDatabase(db_path: string): Promise<Database> {
	let SQL: SqlJsStatic;

	try {
		// @ts-ignore: esbuild
		const { default: wasmURL } = await import("sql.js/dist/sql-wasm.wasm");
		SQL = await initSqlJs({
			locateFile: () => import.meta.resolve("./" + wasmURL),
		});
	} catch {
		SQL = await initSqlJs();
	}

	const database = new SQL.Database(new Uint8Array(await fs.readFile(db_path)));

	const db = drizzle(database, { schema });
	return db;
}
