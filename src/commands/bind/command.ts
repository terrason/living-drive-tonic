import { buildCommand } from "@stricli/core";

export const bindCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Bind",
    },
});
