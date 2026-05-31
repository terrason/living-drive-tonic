import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { createLogger } from "../../utils/logger";

interface ConfigCommandFlags extends GlobalFlags {
    // ...
}

export default async function(this: LocalContext, flags: ConfigCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    logger.log("config command not implemented yet");
}
