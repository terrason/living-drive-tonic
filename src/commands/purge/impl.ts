import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { $ } from "bun";
import path from "node:path";
import { getScriptsDir } from "../../context";
import { createLogger } from "../../utils/logger";

interface PurgeCommandFlags extends GlobalFlags {
    // ...
}

export default async function(this: LocalContext, flags: PurgeCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    const scriptsDir = getScriptsDir();
    const scriptPath = path.resolve(scriptsDir, "purge.sh");

    try {
        await $`sudo bash "${scriptPath}"`;
        logger.log("✓ Living drive purged successfully");
    } catch (error) {
        logger.error("✗ Failed to purge living drive");
        throw error;
    }
}
