import { buildApplication, buildRouteMap } from "@stricli/core";
import { buildInstallCommand, buildUninstallCommand } from "@stricli/auto-complete";
import { version, description } from "../package.json";
import { initCommand } from "./commands/init/command";
import { purgeCommand } from "./commands/purge/command";
import { migrateCommand } from "./commands/migrate/command";
import { fatraceRelayCommand } from "./commands/trace/commands/fatrace-relay/command";
import { traceStartCommand } from "./commands/trace/commands/start/command";
import { resetCommand } from "./commands/reset/command";
import { statCommand } from "./commands/stat/command";
import { configCommand } from "./commands/config/command";
import { bindCommand } from "./commands/bind/command";
import { unbindCommand } from "./commands/unbind/command";
import { syncCommand } from "./commands/sync/command";
import { unsyncCommand } from "./commands/unsync/command";

const BIN_NAME="ldt";

const routes = buildRouteMap({
    routes: {
        // init: initCommand,
        // purge: purgeCommand,
        migrate: migrateCommand,
        trace: buildRouteMap({
            routes: {
                relay: fatraceRelayCommand,
                start: traceStartCommand,
            },
            defaultCommand: "start",
            docs: {
                brief: "Trace file access patterns",
                fullDescription: "Continuously observes system file access behavior and aggregates statistics by configured categories",
                customUsage: [
                    "trace start --verbose --flush-period 30",
                    "trace relay -vv",
                ],
            },
        }),
        reset: resetCommand,
        stat: statCommand,
        config: configCommand,
        bind: bindCommand,
        unbind: unbindCommand,
        sync: syncCommand,
        unsync: unsyncCommand,
    },
    docs: {
        brief: description,
        hideRoute: {
            migrate: true,
        },
    },
});

export const app = buildApplication(routes, {
    name: BIN_NAME,
    versionInfo: {
        currentVersion: version,
    },
});
