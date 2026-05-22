import type { LocalContext } from "../../context";

interface UnsyncCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: UnsyncCommandFlags): Promise<void> {
    console.log("unsync command not implemented yet");
}
