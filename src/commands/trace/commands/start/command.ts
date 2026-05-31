import { buildCommand, numberParser } from "@stricli/core";
import { parameters } from "../../../../globalFlags";

export const traceStartCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        flags: {
            ...parameters.flags,
            flushPeriod: {
                kind: "parsed",
                parse: numberParser,
                brief: "The period (in minutes) for flushing aggregated statistics to the database. Default is 30 minutes.",
                default: "30",
            },
        },
        aliases: {
            ...parameters.aliases,
            p: "flushPeriod",
        },

    },
    docs: {
        brief: "Continuously observes system file access behavior and aggregates statistics by configured categories",
        customUsage: [
            "--verbose",
            "-v",
            "-vv",
            "--flush-period <minutes>",
        ],
    },
});
