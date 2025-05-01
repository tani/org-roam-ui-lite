import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.ts";

export const db = drizzle(
	createClient({
		url: `file:${process.cwd()}/database.db`,
	}),
	{ schema },
);
