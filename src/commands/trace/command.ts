import { buildCommand } from "@stricli/core";

export const traceCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Monitor file access patterns",
        description: "Continuously observes system file access behavior and aggregates statistics by configured categories",
    },
});
