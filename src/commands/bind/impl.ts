import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { createLogger } from "../../utils/logger";

interface BindCommandFlags extends GlobalFlags {
    // ...
}

export default async function(this: LocalContext, flags: BindCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    logger.log("bind command not implemented yet");
}
