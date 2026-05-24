import { buildCommand } from "@stricli/core";

export const initCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Initialize the living drive",
        description: "Sets up the storage areas needed to protect your portable Linux drive and extend its lifespan",
    },
});

