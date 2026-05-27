import type { CommandContext } from "@stricli/core";
import type { StricliAutoCompleteContext } from "@stricli/auto-complete";
import type { SQLiteBunDatabase } from "drizzle-orm/bun-sqlite";
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrateDatabase } from "./db/utils";
import { name } from "../package.json";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const isProduction = process.env.NODE_ENV === 'production';
console.log(`[DEBUG] Running in ${isProduction ? 'production' : 'development'} mode`);

export const DB_PATH = isProduction ? (process.env["DB_FILE_NAME"] ?? `/var/lib/${name}/sqlite.db`) : `${import.meta.dir}/../.var/sqlite.db`;
console.log(`[DEBUG] Database path: ${DB_PATH}`);

let db: SQLiteBunDatabase | null = null;

export async function getDatabase() {
    if (db) {
        return db;
    }

    const dbFile = Bun.file(DB_PATH);
    const dbFileExists = await dbFile.exists();

    db = drizzle(DB_PATH);
    if (!dbFileExists) {
        migrateDatabase(db);
    }

    return db;
}

export const RELAY_SOCKET_PATH = `/run/${name}/fatrace-relay.sock`;

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
function findPackageJSON(startDir: string): string | null {
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


export const EXIT = {
    /** 0-通用的成功代码. 由标准C库定义 */
    SUCCESS: 0,
    /** 1-通用的失败代码. 由标准C库定义 */
    FAILURE: 1,
    /** 2-参数无效或超量. 由 LSB specification 定义 */
    LSB_INVALIDARGUMENT: 2,
    /** 3-功能尚未实现. 由 LSB specification 定义 */
    LSB_NOTIMPLEMENTED: 3,
    /** 4-用户权限不足. 由 LSB specification 定义 */
    LSB_NOPERMISSION: 4,
    /** 5-程序尚未安装. 由 LSB specification 定义 */
    LSB_NOTINSTALLED: 5,
    /** 6-程序尚未配置. 由 LSB specification 定义 */
    LSB_NOTCONFIGURED: 6,
    /** 7-程序尚未运行. 由 LSB specification 定义 */
    LSB_NOTRUNNING: 7,
    /** 64-命令行语法错误. 由 BSD 定义 */
    BSD_USAGE: 64,
    /** 65-数据格式错误. 由 BSD 定义 */
    BSD_DATAERR: 65,
    /** 66-不能打开输入. 由 BSD 定义 */
    BSD_NOINPUT: 66,
    /** 67-未知的用户. 由 BSD 定义 */
    BSD_NOUSER: 67,
    /** 68-未知的主机名. 由 BSD 定义 */
    BSD_NOHOST: 68,
    /** 69-服务不可用. 由 BSD 定义 */
    BSD_UNAVAILABLE: 69,
    /** 70-软件内部错误. 由 BSD 定义 */
    BSD_SOFTWARE: 70,
    /** 71-系统错误(例如不能 fork). 由 BSD 定义 */
    BSD_OSERR: 71,
    /** 72-缺少关键的操作系统文件. 由 BSD 定义 */
    BSD_OSFILE: 72,
    /** 73-不能创建(用户)输出文件. 由 BSD 定义 */
    BSD_CANTCREAT: 73,
    /** 74-输入/输出 错误. 由 BSD 定义 */
    BSD_IOERR: 74,
    /** 75-临时性错误(用户可以尝试重试). 由 BSD 定义 */
    BSD_TEMPFAIL: 75,
    /** 76-协议出现远端错误. 由 BSD 定义 */
    BSD_PROTOCOL: 76,
    /** 77-没有权限. 由 BSD 定义 */
    BSD_NOPERM: 77,
    /** 78-配置错误. 由 BSD 定义 */
    BSD_CONFIG: 78,
    /** 200-切换进程的工作目录失败。参见上文的 WorkingDirectory= 选项。 <p>由systemd定义</p> */
    SYSTEMD_CHDIR: 200,
    /** 201-设置进程的调度优先级(谦让值)失败。参见上文的 Nice= 选项。 <p>由systemd定义</p> */
    SYSTEMD_NICE: 201,
    /** 202-关闭进程不需要的文件描述符失败，或者调整传递过来的文件描述符失败。 <p>由systemd定义</p> */
    SYSTEMD_FDS: 202,
    /** 203-实际进程执行失败(也就是 execve(2) 系统调用失败)。这通常是因为可执行文件不存在或者没有执行权限造成的。 <p>由systemd定义</p> */
    SYSTEMD_EXEC: 203,
    /** 204-内存不足导致操作失败 <p>由systemd定义</p> */
    SYSTEMD_MEMORY: 204,
    /** 205-调整进程的资源限制失败。参见上文的 LimitCPU= 等资源限制选项。 <p>由systemd定义</p> */
    SYSTEMD_LIMITS: 205,
    /** 206-调整进程的 OOM 设置失败。参见上文的 OOMScoreAdjust= 选项。 <p>由systemd定义</p> */
    SYSTEMD_OOM_ADJUST: 206,
    /** 207-设置进程的信号屏蔽失败 <p>由systemd定义</p> */
    SYSTEMD_SIGNAL_MASK: 207,
    /** 208-设置进程的标准输入失败。参见上文的 StandardInput= 选项。 <p>由systemd定义</p> */
    SYSTEMD_STDIN: 208,
    /** 209-设置进程的标准输出失败。参见上文的 StandardOutput= 选项。 <p>由systemd定义</p> */
    SYSTEMD_STDOUT: 209,
    /** 210-切换进程的根目录(chroot(2))失败。参见上文的 RootDirectory=/RootImage= 选项。 <p>由systemd定义</p> */
    SYSTEMD_CHROOT: 210,
    /** 211-设置进程的IO调度优先级失败。参见上文的 IOSchedulingClass=/IOSchedulingPriority= 选项。 <p>由systemd定义</p> */
    SYSTEMD_IOPRIO: 211,
    /** 212-设置进程的定时器粒度失败。参见上文的 TimerSlackNSec= 选项。 <p>由systemd定义</p> */
    SYSTEMD_TIMERSLACK: 212,
    /** 213-设置进程的安全位失败。参见上文的 SecureBits= 选项。 <p>由systemd定义</p> */
    SYSTEMD_SECUREBITS: 213,
    /** 214-设置进程的CPU调度优先级失败。参见上文的 CPUSchedulingPolicy=/CPUSchedulingPriority= 选项。 <p>由systemd定义</p> */
    SYSTEMD_SETSCHEDULER: 214,
    /** 215-设置进程的CPU关联性失败。参见上文的 CPUAffinity= 选项。 <p>由systemd定义</p> */
    SYSTEMD_CPUAFFINITY: 215,
    /** 216-检测或修改进程的用户组失败。参见上文的 Group=/SupplementaryGroups= 选项。 <p>由systemd定义</p> */
    SYSTEMD_GROUP: 216,
    /** 217-检测或修改进程的用户身份失败、或者设置用户名字空间失败。参见上文的 User=/PrivateUsers= 选项。 <p>由systemd定义</p> */
    SYSTEMD_USER: 217,
    /** 218-修改进程的 capability 集合失败。参见上文的 CapabilityBoundingSet=/AmbientCapabilities= 选项。 <p>由systemd定义</p> */
    SYSTEMD_CAPABILITIES: 218,
    /** 219-设置服务单元的控制组失败 <p>由systemd定义</p> */
    SYSTEMD_CGROUP: 219,
    /** 220-未能创建新的进程会话 <p>由systemd定义</p> */
    SYSTEMD_SETSID: 220,
    /** 221-执行过程被用户取消。详见 kernel-command-line(7) 手册中的 systemd.confirm_spawn= 内核引导选项。 <p>由systemd定义</p> */
    SYSTEMD_CONFIRM: 221,
    /** 222-设置进程的标准错误失败。参见上文的 StandardError= 选项。 <p>由systemd定义</p> */
    SYSTEMD_STDERR: 222,
    /** 224-设置进程的PAM会话失败。参见上文的 PAMName= 选项。 <p>由systemd定义</p> */
    SYSTEMD_PAM: 224,
    /** 225-设置进程的网络名字空间失败。参见上文的 PrivateNetwork= 选项。 <p>由systemd定义</p> */
    SYSTEMD_NETWORK: 225,
    /** 226-设置进程的文件系统名字空间失败。参见上文的 ReadOnlyPaths= 等文件系统相关选项。 <p>由systemd定义</p> */
    SYSTEMD_NAMESPACE: 226,
    /** 227-未能禁用进程的新权限。参见上文的 NoNewPrivileges=yes 选项。 <p>由systemd定义</p> */
    SYSTEMD_NO_NEW_PRIVILEGES: 227,
    /** 228-设置进程的系统调用过滤器失败。参见上文的 SystemCallFilter= 等相关选项。 <p>由systemd定义</p> */
    SYSTEMD_SECCOMP: 228,
    /** 229-检测或设置进程的 SELinux 安全上下文失败。参见上文的 SELinuxContext= 选项。 <p>由systemd定义</p> */
    SYSTEMD_SELINUX_CONTEXT: 229,
    /** 230-设置进程的执行域(体系结构)失败。参见上文的 Personality= 选项。 <p>由systemd定义</p> */
    SYSTEMD_PERSONALITY: 230,
    /** 231-无法更改进程的 AppArmor profile 。参见上文的 AppArmorProfile= 选项。 <p>由systemd定义</p> */
    SYSTEMD_APPARMOR_PROFILE: 231,
    /** 232-限制进程可以访问的套接字类型失败。参见上文的 RestrictAddressFamilies= 选项。 <p>由systemd定义</p> */
    SYSTEMD_ADDRESS_FAMILIES: 232,
    /** 233-设置进程的运行时目录失败。参见上文的 RuntimeDirectory= 等相关选项。 <p>由systemd定义</p> */
    SYSTEMD_RUNTIME_DIRECTORY: 233,
    /** 235-修改套接字的拥有者失败。仅用于 socket 单元。 <p>由systemd定义</p> */
    SYSTEMD_CHOWN: 235,
    /** 236-设置进程的 SMACK64 安全标签失败。参见上文的 SmackProcessLabel= 选项。 <p>由systemd定义</p> */
    SYSTEMD_SMACK_PROCESS_LABEL: 236,
    /** 237-设置内核密钥环失败 <p>由systemd定义</p> */
    SYSTEMD_KEYRING: 237,
    /** 238-设置单元的状态目录失败。参见上文的 StateDirectory= 选项。 <p>由systemd定义</p> */
    SYSTEMD_STATE_DIRECTORY: 238,
    /** 239-设置单元的缓存目录失败。参见上文的 CacheDirectory= 选项。 <p>由systemd定义</p> */
    SYSTEMD_CACHE_DIRECTORY: 239,
    /** 240-设置单元的日志目录失败。参见上文的 LogsDirectory= 选项。 <p>由systemd定义</p> */
    SYSTEMD_LOGS_DIRECTORY: 240,
    /** 241-设置单元的配置目录失败。参见上文的 ConfigurationDirectory= 选项。 <p>由systemd定义</p> */
    SYSTEMD_CONFIGURATION_DIRECTORY: 241,
}

