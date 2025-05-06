import * as fs from "node:fs/promises";
import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import { args } from "./args.ts";
import * as schema from "./schema.ts";

const SQL = await Promise.resolve()
	.then(() => import("sql.js/dist/sql-wasm.wasm"))
	.then(({ default: wasmURL }) => import.meta.resolve(wasmURL))
	.then((wasmURL) => initSqlJs({ locateFile: () => wasmURL }))
	.catch(() => initSqlJs());

const database = new SQL.Database(new Uint8Array(await fs.readFile(args.values.database)));

export const db = drizzle(database, { schema });
