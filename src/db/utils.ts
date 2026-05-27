import type { SQLiteBunDatabase } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { SHARE_DIR } from "../context";

export function migrateDatabase(db: SQLiteBunDatabase) {
    migrate(db, { migrationsFolder: `${SHARE_DIR}/drizzle` });
}