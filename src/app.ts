import { buildApplication, buildRouteMap } from "@stricli/core";
import { version, description } from "../package.json";
import { initCommand } from "./commands/init/command";
import { purgeCommand } from "./commands/purge/command";
import { traceCommand } from "./commands/trace/command";
import { configCommand } from "./commands/config/command";
import { bindCommand } from "./commands/bind/command";
import { unbindCommand } from "./commands/unbind/command";
import { syncCommand } from "./commands/sync/command";
import { unsyncCommand } from "./commands/unsync/command";

const routes = buildRouteMap({
    routes: {
        init: initCommand,
        purge: purgeCommand,
        trace: traceCommand,
        config: configCommand,
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
    name: "ldt",
    versionInfo: {
        currentVersion: version,
    },
});
