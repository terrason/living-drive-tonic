import { buildCommand } from "@stricli/core";

export const syncCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Sync",
    },
});
