import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { DB_PATH } from "../../context";
import { migrateDatabase } from "../../db/utils";
import { createLogger } from "../../utils/logger";

interface MigrateCommandFlags extends GlobalFlags {
    // ...
}

export default async function(this: LocalContext, flags: MigrateCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    try {
        const db = drizzle(DB_PATH);
        migrateDatabase(db);
        logger.log("✓ Database migrations applied successfully");
    } catch (error) {
        logger.error("✗ Failed to apply database migrations");
        throw error;
    }
}
