import { build } from "bun";

await build({
  entrypoints: ["src/bin/cli.ts", "src/bin/bash-complete.ts"],
  outdir: "dist",
  target: "bun",
  format: "esm",
  minify: false,
  splitting: false,
  sourcemap: "external",
});
