import * as fs from "node:fs/promises";
import { drizzle, type SQLJsDatabase } from "drizzle-orm/sql-js";
import initSqlJs, { type SqlJsStatic } from "sql.js";
import * as schema from "./schema.ts";

export type Database = SQLJsDatabase<typeof schema>;

/**
 * Open the SQLite database and wrap it with Drizzle.
 *
 * @param databasePath - Path to the database file
 * @returns Drizzle connection bound to the schema
 */
export async function createDatabase(databasePath: string): Promise<Database> {
  let SQL: SqlJsStatic;
  try {
    const { default: wasmBinary } = await import("sql.js/dist/sql-wasm.wasm");
    SQL = await initSqlJs({ wasmBinary });
  } catch {
    SQL = await initSqlJs();
  }
  const blob = new Uint8Array(await fs.readFile(databasePath));
  const database = new SQL.Database(blob);
  return drizzle(database, { schema });
}
