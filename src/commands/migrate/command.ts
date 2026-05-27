import { buildCommand } from "@stricli/core";

export const migrateCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "Migrates the database schema to the latest version",
        description: "Runs database migrations to ensure the schema is up-to-date. This should be run automatically on package upgrades, but can be run manually if needed.",
    },

});

