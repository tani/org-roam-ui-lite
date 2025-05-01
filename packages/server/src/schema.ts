import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const files = sqliteTable("files", {
	file: text("file").primaryKey(),
	title: text("title"),
});

export const nodes = sqliteTable("nodes", {
	id: text("id").primaryKey(),
	file: text("file").references(() => files.file),
	title: text("title"),
	pos: integer("pos"),
});

export const links = sqliteTable("links", {
	source: text("source").references(() => nodes.id),
	dest: text("dest").references(() => nodes.id),
});
