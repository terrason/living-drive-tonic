import type { GlobalFlags } from "../globalFlags";

export interface Logger {
    log(message: string): void;
    info(message: string): void;
    debug(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

export function createLogger(flags: GlobalFlags): Logger {
    return {
        log: (msg: string) => console.log(msg),
        info: (msg: string) => {
            if (flags.verbose >= 1) console.log(`[INFO] ${msg}`);
        },
        debug: (msg: string) => {
            if (flags.verbose >= 2) console.log(`[DEBUG] ${msg}`);
        },
        warn: (msg: string) => console.warn(`[WARN] ${msg}`),
        error: (msg: string) => console.error(`[ERROR] ${msg}`),
    };
}
