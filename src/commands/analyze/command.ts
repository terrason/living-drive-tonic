import { buildCommand } from "@stricli/core";

export const analyzeCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Analyze",
    },
});
