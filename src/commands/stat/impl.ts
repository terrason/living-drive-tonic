import type { LocalContext } from "../../context";
import { db } from "../../context";
import { statTable } from "../../db/schema";
import { desc } from 'drizzle-orm';

interface StatCommandFlags {
    // ...
}

export default async function (this: LocalContext, flags: StatCommandFlags): Promise<void> {
    try {
        const result = await db.select().from(statTable).orderBy(desc(statTable.count));
        console.table(result);
    } catch (error) {
        console.error("✗ Failed to retrieve statistic data");
        throw error;
    }
}
