import { buildCommand } from "@stricli/core";

export const statCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "show hotspot paths",
        description: "Displays the paths of the most frequently accessed files in the living drive.",
    },
});

