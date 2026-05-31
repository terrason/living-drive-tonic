import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { createLogger } from "../../utils/logger";

interface UnsyncCommandFlags extends GlobalFlags {
    // ...
}

export default async function(this: LocalContext, flags: UnsyncCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    logger.log("unsync command not implemented yet");
}
