import type { LocalContext } from "../../context";
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { DB_PATH } from "../../context";
import { migrateDatabase } from "../../db/utils";

interface MigrateCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: MigrateCommandFlags): Promise<void> {
    try {
        const db = drizzle(DB_PATH);
        migrateDatabase(db);
        console.log("✓ Database migrations applied successfully");
    } catch (error) {
        console.error("✗ Failed to apply database migrations");
        throw error;
    }
}
