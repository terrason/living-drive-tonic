import type { LocalContext } from "../../context";

interface UnbindCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: UnbindCommandFlags): Promise<void> {
    console.log("unbind command not implemented yet");
}
