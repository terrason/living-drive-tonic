import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { $ } from "bun";
import path from "node:path";
import { getScriptsDir } from "../../context";
import { createLogger } from "../../utils/logger";

interface InitCommandFlags extends GlobalFlags {
    // ...
}

export default async function(this: LocalContext, flags: InitCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    const scriptsDir = getScriptsDir();
    const scriptPath = path.resolve(scriptsDir, "init.sh");

    try {
        await $`sudo bash "${scriptPath}"`;
        logger.log("✓ Directory structure initialized successfully");
    } catch (error) {
        logger.error("✗ Failed to initialize directory structure");
        throw error;
    }
}
