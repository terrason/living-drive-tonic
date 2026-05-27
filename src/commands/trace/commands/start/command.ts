import { buildCommand } from "@stricli/core";

export const traceStartCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Continuously observes system file access behavior and aggregates statistics by configured categories",
        description: "This command monitor file access events in real-time. It collects data on which files are being accessed and aggregates this information based on user-defined categories. The aggregated statistics can then be used for analysis or optimization purposes.",
    },
});
