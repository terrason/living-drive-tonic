import { buildCommand } from "@stricli/core";

export const unsyncCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Unsync",
    },
});
