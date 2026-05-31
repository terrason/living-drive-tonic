export const parameters = {
    flags: {
        verbose: {
            kind: "counter",
            brief: "Controls how verbose logging should be",
        }
    },
    aliases: {
        v: "verbose"
    },
};


export interface GlobalFlags {
    /**
     * Controls how verbose logging should be. Can be specified multiple times for increased verbosity.
     * * `-v` for info logs
     * * `-vv` for debug logs
     */
    verbose: number;
}
