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
        brief: "Remove the living drive",
        description: "Removes all storage areas created during initialization and reverts the setup",
    },
});
