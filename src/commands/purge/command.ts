import { buildCommand } from "@stricli/core";

export const purgeCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Purge",
    },
});
