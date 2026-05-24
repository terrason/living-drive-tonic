import { count } from "drizzle-orm";
import { int, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const categoryTable = sqliteTable("categories", {
  id: int().primaryKey({ autoIncrement: true }),
  path: text().notNull().unique(),
});
export const statTable = sqliteTable("stats", {
  path: text().primaryKey(),
  count: int().notNull().default(0)
}, (table) => [
  index("idx_stat_count").on(table.count)
]);