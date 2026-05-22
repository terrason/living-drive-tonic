import type { LocalContext } from "../../context";

interface TraceCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: TraceCommandFlags): Promise<void> {
    console.log("trace command not implemented yet");
}
