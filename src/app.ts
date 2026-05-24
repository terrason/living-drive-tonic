import { buildApplication, buildRouteMap } from "@stricli/core";
import { buildInstallCommand, buildUninstallCommand } from "@stricli/auto-complete";
import { version, description } from "../package.json";
import { initCommand } from "./commands/init/command";
import { purgeCommand } from "./commands/purge/command";
import { traceCommand } from "./commands/trace/command";
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
        init: initCommand,
        purge: purgeCommand,
        trace: traceCommand,
        reset: resetCommand,
        stat: statCommand,
        config: configCommand,
        bind: bindCommand,
        unbind: unbindCommand,
        sync: syncCommand,
        unsync: unsyncCommand,
        install: buildInstallCommand(BIN_NAME, { bash: `__${BIN_NAME}_bash_complete` }),
        uninstall: buildUninstallCommand(BIN_NAME, { bash: true }),
    },
    docs: {
        brief: description,
    },
});

export const app = buildApplication(routes, {
    name: BIN_NAME,
    versionInfo: {
        currentVersion: version,
    },
});
