import {
	customType,
	integer,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

const jsonText = customType<{
	data: string;
	driverData: string;
}>({
	dataType() {
		return "text";
	},
	fromDriver(value) {
		try {
			return JSON.parse(value); // 取得時
		} catch {
			return value;
		}
	},
});

export const files = sqliteTable("files", {
	file: jsonText().primaryKey(),
	title: jsonText(),
});

export const nodes = sqliteTable("nodes", {
	id: jsonText().primaryKey(),
	file: jsonText().references(() => files.file),
	title: jsonText(),
	pos: integer("pos"),
});

export const links = sqliteTable("links", {
	source: jsonText().references(() => nodes.id),
	dest: jsonText().references(() => nodes.id),
});
