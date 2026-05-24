import type { LocalContext } from "../../context";
import { $ } from "bun";
import path from "node:path";
import { getScriptsDir } from "../../context";

interface PurgeCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: PurgeCommandFlags): Promise<void> {
    const scriptsDir = getScriptsDir();
    const scriptPath = path.resolve(scriptsDir, "purge.sh");

    try {
        await $`sudo bash "${scriptPath}"`;
        console.log("✓ Living drive purged successfully");
    } catch (error) {
        console.error("✗ Failed to purge living drive");
        throw error;
    }
}
