import initSqlJs from "sql.js/dist/sql-asm.js";
import { drizzle } from "drizzle-orm/sql-js";
import * as schema from "./schema.ts";
import * as fs from "node:fs/promises";

const db_path = process.env.ORU_DB_PATH ?? `${process.cwd()}/database.db`;
const SQL = await initSqlJs()
const database = new SQL.Database(new Uint8Array(await fs.readFile(db_path)))

export const db = drizzle(database, { schema });
