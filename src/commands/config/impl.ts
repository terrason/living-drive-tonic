import type { LocalContext } from "../../context";

interface ConfigCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: ConfigCommandFlags): Promise<void> {
    console.log("config command not implemented yet");
}
