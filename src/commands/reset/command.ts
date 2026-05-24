import { buildCommand } from "@stricli/core";

export const resetCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "reset the hotspot statistics",
        description: "Clears all collected statistics from the database, allowing you to start fresh and remove any existing data about file access patterns. Use this command if you want to reset the state of the living drive and discard all previously collected information.",
    },
});

