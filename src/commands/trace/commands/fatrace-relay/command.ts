import { buildCommand } from "@stricli/core";
import { parameters } from "../../../../globalFlags";

export const fatraceRelayCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: parameters as any,
    docs: {
        brief: "A root helper command for fatrace relay mode",
        customUsage: [
            "--verbose",
            "-v",
            "-vv",
        ],
    },
});
