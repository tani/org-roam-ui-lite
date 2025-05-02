import * as fs from "node:fs/promises";
import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js/dist/sql-asm.js";
import * as schema from "./schema.ts";

const db_path = process.env.ORU_DB_PATH ?? `${process.cwd()}/database.db`;
const SQL = await initSqlJs();
const database = new SQL.Database(new Uint8Array(await fs.readFile(db_path)));

export const db = drizzle(database, { schema });
