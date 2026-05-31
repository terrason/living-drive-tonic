import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { createLogger } from "../../utils/logger";

interface SyncCommandFlags extends GlobalFlags {
    // ...
}

export default async function(this: LocalContext, flags: SyncCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    logger.log("sync command not implemented yet");
}
