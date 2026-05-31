import type { LocalContext } from "../../../../context";
import { chown } from 'node:fs'
import { EXIT, RELAY_SOCKET_PATH } from "../../../../context";
import type { GlobalFlags } from "../../../../globalFlags";
import { createLogger } from "../../../../utils/logger";

interface FatraceRelayCommandFlags extends GlobalFlags {
    // ...
}


export default async function (this: LocalContext, _flags: FatraceRelayCommandFlags): Promise<void> {
    const logger = createLogger(_flags);

    if (process.geteuid() !== 0) {
        logger.error(`This program must be run as root`);
        process.exit(EXIT.FAILURE);
    }

    await Bun.file(RELAY_SOCKET_PATH).delete().catch(() => { });

    // 1. 收集所有活跃连接的 Socket 实例
    let client: Bun.Socket | null;

    // 2. 使用底层 Bun.listen 处理原始 TCP/Unix 流量
    const server = Bun.listen({
        unix: RELAY_SOCKET_PATH,
        socket: {
            open(socket) {
                if (client) {
                    logger.warn(`Consumer port is already in use. Rejecting new connection.`);
                    socket.end("ERROR: There is already a client pinned, only one client allowed at a time.\n");
                    return;
                }
                client = socket;
                logger.debug(`New client connected to fatrace relay`);
            },
            close(socket) {
                if (socket === client) {
                    client = null;
                    logger.debug(`Client disconnected from fatrace relay`);
                }
            },
            error(socket, error) {
                logger.error(`Client error on fatrace relay`);
                if (socket === client) {
                    client = null;
                }
            },
            data(socket, data) {
                // 忽略客户端输入
            }
        },
    });
    logger.info(`Fatrace relay server started at ${RELAY_SOCKET_PATH}`);
    await Bun.$`chmod 660 ${RELAY_SOCKET_PATH}`
    await Bun.$`chown root:ldt ${RELAY_SOCKET_PATH}`

    // 3. 启动进程
    const fatrace = Bun.spawn(['/usr/bin/fatrace', '-cj', '--filter=W+D<>'], {
        stdin: 'ignore',
        stdout: 'pipe',
        stderr: 'inherit'
    })

    // 4. 读取流并广播
    async function broadcastFatraceOutput() {
        for await (const chunk of fatrace.stdout) {
            client && client.write(chunk)
        }
    }
    broadcastFatraceOutput().catch((err) => {
        logger.error(`Error broadcasting fatrace output: ${err}`);
    });

    // 5. 退出处理
    fatrace.exited.then((code) => {
        if (code === 143) {
            logger.debug(`Fatrace process terminated by signal (expected on shutdown)`);
            return;
        }
        if (code !== EXIT.SUCCESS) {
            logger.error(`Failed to spawn fatrace process: fatrace exit code:${code}`);
            process.exit(EXIT.FAILURE);
        }
    })

    function handleShutdown() {
        fatrace.kill()
        server.stop()
        logger.info(`Fatrace relay server stopped`);
        process.exit(EXIT.SUCCESS);
    }
    process.on('SIGTERM', handleShutdown);
    process.on("SIGINT", handleShutdown);


    if (process.env["NOTIFY_SOCKET"]) {
        await Bun.$`systemd-notify --ready --status="Fatrace relay server is ready"`;
    }
}
