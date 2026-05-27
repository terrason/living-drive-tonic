import type { SQLiteBunDatabase } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

export function migrateDatabase(db: SQLiteBunDatabase) {
    migrate(db, { migrationsFolder: "./drizzle" });
}