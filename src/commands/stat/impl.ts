import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { getDatabase } from "../../context";
import { statTable } from "../../db/schema";
import { desc } from 'drizzle-orm';
import { createLogger } from "../../utils/logger";

interface StatCommandFlags extends GlobalFlags {
    // ...
}

export default async function (this: LocalContext, flags: StatCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    try {
        const db = await getDatabase();
        const result = await db.select().from(statTable).orderBy(desc(statTable.count));
        console.table(result);
    } catch (error) {
        logger.error("✗ Failed to retrieve statistic data");
        throw error;
    }
}
