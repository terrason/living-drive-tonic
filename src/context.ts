import type { CommandContext } from "@stricli/core";
import type { StricliAutoCompleteContext } from "@stricli/auto-complete";
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { name } from "../package.json";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const dbPath=process.env["DB_FILE_NAME"] ?? "/var/lib/living-drive-tonic/sqlite.db";
export const db = drizzle(dbPath);

export interface LocalContext extends CommandContext, StricliAutoCompleteContext {
    readonly process: NodeJS.Process;
    // ...
}

export function buildContext(process: NodeJS.Process): LocalContext {
    return {
        process,
        os,
        fs,
        path,
    };
}
function findPackageJSON(startDir:string):string | null {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    const pkgPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) return pkgPath;
    currentDir = path.dirname(currentDir);
  }
  return null;
}

export function getScriptsDir(): string {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        return import.meta.env['LDT_LIB_DIR'] ?? `/usr/lib/${name}`;
    }

    const packagePath = findPackageJSON(import.meta.path);
    if (!packagePath) {
        throw new Error("Could not find package.json");
    }

    const packageRoot = path.dirname(packagePath);
    return path.join(packageRoot, "scripts");
}

