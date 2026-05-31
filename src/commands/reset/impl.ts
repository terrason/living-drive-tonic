import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { getDatabase } from "../../context";
import { statTable } from "../../db/schema";
import { createLogger } from "../../utils/logger";

interface ResetCommandFlags extends GlobalFlags {
    // ...
}

export default async function (this: LocalContext, flags: ResetCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    try {
        const db = await getDatabase();
        await db.delete(statTable).execute();
        logger.log("✓ Statistic data reset successfully");
    } catch (error) {
        logger.error("✗ Failed to reset statistic data");
        throw error;
    }
}
