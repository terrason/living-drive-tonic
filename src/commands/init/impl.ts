import type { LocalContext } from "../../context";

interface InitCommandFlags {
    // ...
}

export default async function(this: LocalContext, flags: InitCommandFlags): Promise<void> {
    console.log("init command not implemented yet");
}
