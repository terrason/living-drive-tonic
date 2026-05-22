import type { LocalContext } from "../../context";

interface BindCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: BindCommandFlags): Promise<void> {
    console.log("bind command not implemented yet");
}
