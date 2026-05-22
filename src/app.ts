import { buildApplication, buildRouteMap } from "@stricli/core";
import { name, version, description } from "../package.json";
import { initCommand } from "./commands/init/command";
import { purgeCommand } from "./commands/purge/command";
import { traceCommand } from "./commands/trace/command";
import { analyzeCommand } from "./commands/analyze/command";
import { bindCommand } from "./commands/bind/command";
import { unbindCommand } from "./commands/unbind/command";
import { syncCommand } from "./commands/sync/command";
import { unsyncCommand } from "./commands/unsync/command";

const routes = buildRouteMap({
    routes: {
        init: initCommand,
        purge: purgeCommand,
        trace: traceCommand,
        analyze: analyzeCommand,
        bind: bindCommand,
        unbind: unbindCommand,
        sync: syncCommand,
        unsync: unsyncCommand,
    },
    docs: {
        brief: description,
    },
});

export const app = buildApplication(routes, {
    name,
    versionInfo: {
        currentVersion: version,
    },
});
