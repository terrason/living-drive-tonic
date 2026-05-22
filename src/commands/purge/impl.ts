import type { LocalContext } from "../../context";

interface PurgeCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: PurgeCommandFlags): Promise<void> {
    console.log("purge command not implemented yet");
}
