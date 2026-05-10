import { DatabaseSync } from "node:sqlite";
import type { NodeSQLiteDatabase } from "drizzle-orm/node-sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";
import * as schema from "./schema.ts";

export type Database = NodeSQLiteDatabase<typeof schema>;

/**
 * Open the SQLite database and wrap it with Drizzle.
 *
 * @param databasePath - Path to the database file
 * @returns Drizzle connection bound to the schema
 */
export function createDatabase(databasePath: string): Database {
	const sqlite = new DatabaseSync(databasePath);
	return drizzle({ client: sqlite, schema });
}
