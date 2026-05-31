import net from "node:net";
import { createInterface } from "node:readline";
import type { LocalContext } from "../../../../context";
import type { GlobalFlags } from "../../../../globalFlags";
import { getDatabase, EXIT, RELAY_SOCKET_PATH } from "../../../../context";
import * as schema from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { createLogger, type Logger } from "../../../../utils/logger";

interface TraceStartCommandFlags extends GlobalFlags {
    flushPeriod: number;
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

async function loadCategories(logger: Logger): Promise<Category[]> {
    const db = await getDatabase();
    const categories = await db
        .select({ path: schema.categoryTable.path, id: schema.categoryTable.id })
        .from(schema.categoryTable);

    if (categories.length === 0) {
        logger.log("No categories configured. Please add categories to start tracing.");
        process.exit(EXIT.LSB_NOTCONFIGURED);
    }

    logger.debug(`Loaded ${categories.length} categories from database`);
    categories.forEach((cat) => logger.debug(`  - ${cat.path}`));

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

async function persistToDatabase(flushBuffer: Map<string, number>, logger: Logger) {
    logger.debug(`Flush started (${flushBuffer.size} buckets)`);
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
            logger.error(
                `[${new Date().toISOString()}] Failed to persist stat for ${bucket}: ${error}`
            );
        }
    }

    const duration = Date.now() - startTime;
    logger.debug(`Flushed ${flushBuffer.size} buckets (${totalCount} events, ${successCount} ok, ${errorCount} failed) in ${duration}ms`);
}

function parseLineEvent(line: string, logger: Logger): { comm?: string; pid?: number; types?: string; path?: string } | null {
    try {
        const obj = JSON.parse(line);
        return {
            comm: obj.comm,
            pid: obj.pid,
            types: obj.types,
            path: obj.path,
        };
    } catch {
        logger.info(`Malformed JSON line: ${line}`);
        return null;
    }
}


export default async function (
    this: LocalContext,
    _flags: TraceStartCommandFlags
): Promise<void> {
    const logger = createLogger(_flags);
    const flushPeriodMs = _flags.flushPeriod * 60 * 1000;
    const categories = await loadCategories(logger);
    const matcher = buildCategoryIndex(categories);
    const buffer = createDualBuffer();

    let isShuttingDown = false;
    let flushInProgress: Promise<void> | null = null;
    let eventCount = 0;

    logger.info(`Starting DEBUG command with ${_flags.flushPeriod}-minute flush period. pid: ${process.pid}`);

    logger.debug(`Connecting to relay socket at ${RELAY_SOCKET_PATH}...`);
    let socketBuffer = "";
    const socket = await Bun.connect({
        unix: RELAY_SOCKET_PATH,
        socket: {
            data(socket, chunk) {
                const line = Buffer.from(chunk).toString();
                if(line.startsWith("ERROR:")) {
                    logger.error(`Relay socket error: ${line}`);
                    socket.close();
                    process.exit(EXIT.BSD_UNAVAILABLE);
                    return;
                }
                socketBuffer += line;

                let idx;

                while ((idx = socketBuffer.indexOf("\n")) !== -1) {
                    const line = socketBuffer.slice(0, idx);
                    socketBuffer = socketBuffer.slice(idx + 1);

                    handleLine(line);
                }
            },
            open() {
                logger.debug(`Relay socket connected`);
            },
            close() {
                logger.error(`Relay socket closed`);
                process.exit(EXIT.BSD_UNAVAILABLE);
            },
            error(_, err) {
                logger.error(`Relay socket error: ${err.message}`);
                process.exit(EXIT.BSD_UNAVAILABLE);
            },
            connectError(_, err) {
                logger.error(`Failed to connect to relay socket: ${err.message}`);
                process.exit(EXIT.BSD_UNAVAILABLE);
            },
        },
    });


    function handleLine(line: string) {
        if (isShuttingDown) return;

        const event = parseLineEvent(line, logger);
        if (!event || !event.path) {
            //不输出日志，存在很多 `{"comm":"code","pid":6091,"types":"CW"}` 这样的行
            return;
        }

        const bucket = matcher(event.path);
        if (bucket === UNMATCHED) {
            logger.debug(`Unmatched path: ${event.path}`);
        }
        buffer.incrementActive(bucket);
        eventCount++;
    }



    function flush() {
        if (flushInProgress) return;

        buffer.swap();
        const flushBuf = buffer.getFlush();
        flushInProgress = persistToDatabase(flushBuf, logger).finally(() => {
            flushInProgress = null;
        });
    }
    let flushTimer = setInterval(flush, flushPeriodMs);

    const handleShutdown = async () => {
        isShuttingDown = true;
        logger.debug(`Shutdown signal received`);
        clearInterval(flushTimer);

        buffer.swap();
        const flushBuf = buffer.getFlush();
        logger.info(`Performing final flush (${eventCount} total events processed)`);
        await persistToDatabase(flushBuf, logger);

        if (flushInProgress) {
            await Promise.race([
                flushInProgress,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Flush timeout")), 5000)
                ),
            ]).catch(() => {
                logger.error(`Final flush timed out`);
            });
        }

        logger.info(`Shutdown complete`);
        process.exit(EXIT.SUCCESS);
    };

    process.on("SIGTERM", handleShutdown);
    process.on("SIGINT", handleShutdown);
    process.on("SIGUSR1", function(){
        logger.debug(`SIGUSR1 received: performing manual flush`);
        clearInterval(flushTimer);
        flush();
        flushTimer = setInterval(flush, flushPeriodMs);
    });

    


}
