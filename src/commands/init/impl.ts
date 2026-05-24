import type { LocalContext } from "../../context";
import { $ } from "bun";
import path from "node:path";
import { getScriptsDir } from "../../context";

interface InitCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: InitCommandFlags): Promise<void> {
    const scriptsDir = getScriptsDir();
    const scriptPath = path.resolve(scriptsDir, "init.sh");

    try {
        await $`sudo bash "${scriptPath}"`;
        console.log("✓ Directory structure initialized successfully");
    } catch (error) {
        console.error("✗ Failed to initialize directory structure");
        throw error;
    }
}
