import net from "node:net";
import { createInterface } from "node:readline";
import type { LocalContext } from "../../../../context";
import { getDatabase, EXIT, RELAY_SOCKET_PATH } from "../../../../context";
import * as schema from "../../../../db/schema";
import { eq } from "drizzle-orm";

interface DEBUGCommandFlags {
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
        parseInt(process.env["LDT_DEBUG_FLUSH_PERIOD_MINUTES"] || "30", 10);

    if (isNaN(periodMinutes)) {
        throw new Error(
            "Invalid LDT_DEBUG_FLUSH_PERIOD_MINUTES: must be a number"
        );
    }

    if (periodMinutes < 10) {
        throw new Error("LDT_DEBUG_FLUSH_PERIOD_MINUTES must be at least 10 minutes");
    }

    return { flushPeriodMs: periodMinutes * 60 * 1000 };
}

async function loadCategories(): Promise<Category[]> {
    const db = await getDatabase();
    const categories = await db
        .select({ path: schema.categoryTable.path, id: schema.categoryTable.id })
        .from(schema.categoryTable);

    if (categories.length === 0) {
        console.log("No categories configured. Please add categories to start tracing.");
        process.exit(EXIT.LSB_NOTCONFIGURED);
    }

    console.log(`[DEBUG] Loaded ${categories.length} categories from database`);
    categories.forEach((cat) => console.log(`  - ${cat.path}`));

    return categories;
}

const UNMATCHED = "__UNMATCHED__";
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

        return UNMATCHED;
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
    console.log(
        `[DEBUG] Flush started (${flushBuffer.size} buckets)`
    );
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    let totalCount = 0;

    const db = await getDatabase();

    for (const [bucket, count] of flushBuffer.entries()) {
        totalCount += count;
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
            successCount++;
        } catch (error) {
            errorCount++;
            console.error(
                `[${new Date().toISOString()}] Failed to persist stat for ${bucket}:`,
                error
            );
        }
    }

    const duration = Date.now() - startTime;
    console.log(
        `[DEBUG] Flushed ${flushBuffer.size} buckets (${totalCount} events, ${successCount} ok, ${errorCount} failed) in ${duration}ms`
    );
}

function parseLineEvent(line: string): { comm?: string; pid?: number; types?: string; path?: string } | null {
    try {
        const obj = JSON.parse(line);
        return {
            comm: obj.comm,
            pid: obj.pid,
            types: obj.types,
            path: obj.path,
        };
    } catch {
        console.log(`[INFO] Malformed JSON line: ${line}`);
        return null;
    }
}


export default async function (
    this: LocalContext,
    _flags: DEBUGCommandFlags
): Promise<void> {
    const { flushPeriodMs } = loadConfig();
    const categories = await loadCategories();
    const matcher = buildCategoryIndex(categories);
    const buffer = createDualBuffer();

    let isShuttingDown = false;
    let flushInProgress: Promise<void> | null = null;
    let eventCount = 0;

    console.log(
        `[INFO] Starting DEBUG command with ${flushPeriodMs / 1000 / 60}-minute flush period. pid:${process.pid}`
    );

    console.log(`[DEBUG] Connecting to relay socket at ${RELAY_SOCKET_PATH}...`);
    let socketBuffer = "";
    const socket = await Bun.connect({
        unix: RELAY_SOCKET_PATH,
        socket: {
            data(socket, chunk) {
                socketBuffer += Buffer.from(chunk).toString();

                let idx;

                while ((idx = socketBuffer.indexOf("\n")) !== -1) {
                    const line = socketBuffer.slice(0, idx);
                    socketBuffer = socketBuffer.slice(idx + 1);

                    handleLine(line);
                }
            },
            open() {
                console.log("[DEBUG] Relay socket connected");
            },
            close() {
                console.log("[DEBUG] Relay socket closed");
            },
            error(_, err) {
                console.error(err);
            },
            connectError(_, err) {
                console.error("connect failed", err);
            },
        },
    });


    function handleLine(line: string) {
        if (isShuttingDown) return;

        const event = parseLineEvent(line);
        if (!event || !event.path) {
            //不输出日志，存在很多 `{"comm":"code","pid":6091,"types":"CW"}` 这样的行
            return;
        }

        const bucket = matcher(event.path);
        if (bucket === UNMATCHED) {
            console.debug(`[DEBUG] Unmatched path: ${event.path}`);
        }
        buffer.incrementActive(bucket);
        eventCount++;
    }



    function flush() {
        if (flushInProgress) return;

        buffer.swap();
        const flushBuf = buffer.getFlush();
        flushInProgress = persistToDatabase(flushBuf).finally(() => {
            flushInProgress = null;
        });
    }
    let flushTimer = setInterval(flush, flushPeriodMs);

    const handleShutdown = async () => {
        isShuttingDown = true;
        console.log("[DEBUG] Shutdown signal received");
        clearInterval(flushTimer);
        // readline.close();
        // faDEBUG.kill();

        buffer.swap();
        const flushBuf = buffer.getFlush();
        console.log(`[INFO] Performing final flush (${eventCount} total events processed)`);
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

        console.log("[INFO] Shutdown complete");
        process.exit(EXIT.SUCCESS);
    };

    process.on("SIGTERM", handleShutdown);
    process.on("SIGINT", handleShutdown);
    process.on("SIGUSR1", function(){
        console.log("[DEBUG] SIGUSR1 received: performing manual flush");
        clearInterval(flushTimer);
        flush();
        flushTimer = setInterval(flush, flushPeriodMs);
    });

    


}
