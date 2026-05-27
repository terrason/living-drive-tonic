import type { LocalContext } from "../../context";
import { getDatabase } from "../../context";
import { statTable } from "../../db/schema";

interface ResetCommandFlags {
    // ...
}

export default async function (this: LocalContext, flags: ResetCommandFlags): Promise<void> {
    try {
        const db = await getDatabase();
        await db.delete(statTable).execute();
        console.log("✓ Statistic data reset successfully");
    } catch (error) {
        console.error("✗ Failed to reset statistic data");
        throw error;
    }
}
