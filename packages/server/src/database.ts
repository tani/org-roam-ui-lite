import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.ts";

const db_path = process.env.ORU_DB_PATH ?? `${process.cwd()}/database.db`;
const url = `file:${db_path}`;

export const db = drizzle(createClient({ url }), { schema });
