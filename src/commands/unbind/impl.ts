import type { LocalContext } from "../../context";
import type { GlobalFlags } from "../../globalFlags";
import { createLogger } from "../../utils/logger";

interface UnbindCommandFlags extends GlobalFlags {
    // ...
}

export default async function(this: LocalContext, flags: UnbindCommandFlags): Promise<void> {
    const logger = createLogger(flags);
    logger.log("unbind command not implemented yet");
}
