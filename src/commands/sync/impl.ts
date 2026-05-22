import type { LocalContext } from "../../context";

interface SyncCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: SyncCommandFlags): Promise<void> {
    console.log("sync command not implemented yet");
}
