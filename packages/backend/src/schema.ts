import { customType, integer, sqliteTable } from "drizzle-orm/sqlite-core";

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
  file: jsonText().primaryKey().notNull(),
  title: jsonText().notNull(),
});

export const nodes = sqliteTable("nodes", {
  id: jsonText().primaryKey().notNull(),
  file: jsonText()
    .references(() => files.file)
    .notNull(),
  title: jsonText().notNull(),
  pos: integer("pos").notNull(),
});

export const links = sqliteTable("links", {
  source: jsonText()
    .references(() => nodes.id)
    .notNull(),
  dest: jsonText()
    .references(() => nodes.id)
    .notNull(),
});
