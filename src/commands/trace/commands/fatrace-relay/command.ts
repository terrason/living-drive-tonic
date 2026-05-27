import { buildCommand } from "@stricli/core";

export const fatraceRelayCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
        positional: {
            kind: "tuple",
            parameters: [],
        },
    },
    docs: {
        brief: "A root helper command for fatrace relay mode",
        description: ["This command is not intended to be used directly by users. ",
            "It serves as a relay for the fatrace process, allowing it to run with elevated privileges ",
            "while the main application(ldt trace start) can operate with normal user permissions. ",
            "The command will spawn the fatrace process, read its output, and relay the relevant information ",
            "back to the main application(ldt trace start) for processing and aggregation.",
        ].join(""),
    },
});
