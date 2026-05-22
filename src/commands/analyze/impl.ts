import type { LocalContext } from "../../context";

interface AnalyzeCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: AnalyzeCommandFlags): Promise<void> {
    console.log("analyze command not implemented yet");
}
