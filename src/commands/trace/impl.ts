import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import type { LocalContext } from "../../context";
import { db } from "../../context";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";

interface TraceCommandFlags {
  // ...
}

interface Category {
  path: string;
  id: number;
}

interface DualBuffer {
  incrementActive: (bucket: string, count?: number) => void;
  getFlush: () => Map<string, number>;
  swap: () => void;
}

function loadConfig(): { flushPeriodMs: number } {
  const periodMinutes =
    parseInt(process.env["TRACE_FLUSH_PERIOD_MINUTES"] || "30", 10);

  if (isNaN(periodMinutes)) {
    throw new Error(
      "Invalid TRACE_FLUSH_PERIOD_MINUTES: must be a number"
    );
  }

  if (periodMinutes < 10) {
    throw new Error("TRACE_FLUSH_PERIOD_MINUTES must be at least 10 minutes");
  }

  return { flushPeriodMs: periodMinutes * 60 * 1000 };
}

async function loadCategories(): Promise<Category[]> {
  const categories = await db
    .select({ path: schema.categoryTable.path, id: schema.categoryTable.id })
    .from(schema.categoryTable);

  if (categories.length === 0) {
    console.log("No categories configured. Please add categories to start tracing.");
    process.exit(0);
  }

  return categories;
}

function buildCategoryIndex(categories: Category[]) {
  const sorted = [...categories].sort(
    (a, b) => b.path.length - a.path.length
  );

  return (filePath: string): string => {
    for (const cat of sorted) {
      const catPath = cat.path;
      const isSubdirRule = catPath.endsWith("/");

      if (isSubdirRule) {
        const basePath = catPath.slice(0, -1);
        if (filePath.startsWith(basePath + "/") || filePath === basePath) {
          const relative = filePath.slice(basePath.length + 1);
          const firstSlash = relative.indexOf("/");
          if (firstSlash === -1) {
            return filePath;
          }
          const subdir = relative.slice(0, firstSlash);
          return basePath + "/" + subdir;
        }
      } else {
        if (filePath === catPath || filePath.startsWith(catPath + "/")) {
          return catPath;
        }
      }
    }

    return "__UNMATCHED__";
  };
}

function createDualBuffer(): DualBuffer {
  let active = new Map<string, number>();
  let flush = new Map<string, number>();

  return {
    incrementActive: (bucket: string, count: number = 1) => {
      active.set(bucket, (active.get(bucket) || 0) + count);
    },
    getFlush: () => flush,
    swap: () => {
      flush = active;
      active = new Map<string, number>();
    },
  };
}

async function persistToDatabase(flushBuffer: Map<string, number>) {
  for (const [bucket, count] of flushBuffer.entries()) {
    try {
      const existing = await db
        .select({ count: schema.statTable.count })
        .from(schema.statTable)
        .where(eq(schema.statTable.path, bucket));

      if (existing.length > 0) {
        const currentCount = existing[0]?.count ?? 0;
        await db
          .update(schema.statTable)
          .set({ count: currentCount + count })
          .where(eq(schema.statTable.path, bucket));
      } else {
        await db.insert(schema.statTable).values({
          path: bucket,
          count: count,
        });
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Failed to persist stat for ${bucket}:`,
        error
      );
    }
  }
}

function parseLineEvent(line: string): { comm?: string; pid?: number; path?: string } | null {
  try {
    const obj = JSON.parse(line);
    return {
      comm: obj.comm,
      pid: obj.pid,
      path: obj.path,
    };
  } catch {
    return null;
  }
}

export default async function (
  this: LocalContext,
  _flags: TraceCommandFlags
): Promise<void> {
  const { flushPeriodMs } = loadConfig();
  const categories = await loadCategories();
  const matcher = buildCategoryIndex(categories);
  const buffer = createDualBuffer();

  const fatrace = spawn("/usr/bin/fatrace", ["-cj", "--filter=W+D<>"]);

  if (!fatrace.stdout) {
    console.error("Failed to spawn fatrace process");
    process.exit(1);
  }

  const readline = createInterface({
    input: fatrace.stdout as NodeJS.ReadableStream,
    crlfDelay: Infinity,
  });

  let isShuttingDown = false;
  let flushInProgress: Promise<void> | null = null;

  readline.on("line", (line: string) => {
    if (isShuttingDown) return;

    const event = parseLineEvent(line);
    if (!event || !event.path) {
      return;
    }

    const bucket = matcher(event.path);
    buffer.incrementActive(bucket);
  });

  const flushInterval = setInterval(() => {
    if (flushInProgress) return;

    buffer.swap();
    const flushBuf = buffer.getFlush();
    flushInProgress = persistToDatabase(flushBuf).finally(() => {
      flushInProgress = null;
    });
  }, flushPeriodMs);

  const handleShutdown = async () => {
    isShuttingDown = true;
    clearInterval(flushInterval);
    readline.close();
    fatrace.kill();

    buffer.swap();
    const flushBuf = buffer.getFlush();
    await persistToDatabase(flushBuf);

    if (flushInProgress) {
      await Promise.race([
        flushInProgress,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Flush timeout")), 5000)
        ),
      ]).catch(() => {
        console.error("Final flush timed out");
      });
    }

    process.exit(0);
  };

  process.on("SIGTERM", handleShutdown);
  process.on("SIGINT", handleShutdown);
}
