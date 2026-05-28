import type { LocalContext } from "../../../../context";
import { chown } from 'node:fs'
import { EXIT, RELAY_SOCKET_PATH } from "../../../../context";

interface FatraceRelayCommandFlags {
    // ...
}


export default async function (this: LocalContext, _flags: FatraceRelayCommandFlags): Promise<void> {
    if (process.geteuid() !== 0) {
        console.error(`[ERROR] This program must be run as root`);
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
                    console.warn(`[WARN] Consumer port is already in use. Rejecting new connection.`);
                    socket.end("ERROR: There is already a client pinned, only one client allowed at a time.\n");
                    return;
                }
                client = socket;
            },
            close(socket) {
                if (socket === client) {
                    client = null;
                }
            },
            error(socket, error) {
                if (socket === client) {
                    client = null;
                }
            },
            data(socket, data) {
                // 忽略客户端输入
            }
        },
    });
    console.log(`[INFO] Fatrace relay server started at ${RELAY_SOCKET_PATH}`);
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
        if (!client) {
            return;
        }

        for await (const chunk of fatrace.stdout) {
            client.write(chunk)
        }
    }
    broadcastFatraceOutput().catch((err) => {
        console.error('Error broadcasting fatrace output', err);
    });

    // 5. 退出处理
    fatrace.exited.then((code) => {
        if (code === 143) {
            console.log('[DEBUG] Fatrace process terminated by signal (expected on shutdown)');
            return;
        }
        if (code !== EXIT.SUCCESS) {
            console.error('[ERROR] Failed to spawn fatrace process: fatrace exit code:%d', code);
            process.exit(EXIT.FAILURE);
        }
    })

    function handleShutdown() {
        fatrace.kill()
        server.stop()
        console.log("[INFO] Fatrace relay server stopped");
    }
    process.on('SIGTERM', handleShutdown);
    process.on("SIGINT", handleShutdown);


    if (process.env["NOTIFY_SOCKET"]) {
        await Bun.$`systemd-notify --ready --status="Fatrace relay server is ready"`;
    }
}
