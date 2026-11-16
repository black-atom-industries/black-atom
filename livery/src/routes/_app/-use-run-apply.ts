import type * as Theme from "@black-atom/core";
import { commands, type Config } from "../../bindings.ts";
import {
    ACTIVE_THEME_PERSISTENCE_APP,
    activeThemePersistenceError,
    commandErrorResult,
    SYSTEM_APPEARANCE_APP,
    themeWasApplied,
} from "../../lib/progress.ts";
import { applyTheme, createUpdaters, getEnabledApps } from "../../lib/updaters.ts";
import { useActiveTheme } from "../../queries/use-active-theme.ts";
import { appStore } from "../../store/app.ts";

/**
 * One apply pass: every enabled adapter, then the system appearance, then the
 * record. A theme read from the config file is already on record, and writing
 * it again could undo a newer edit of the file.
 */
export function useRunApply() {
    const activeTheme = useActiveTheme();

    return async function runApply(
        theme: Theme.Definition,
        config: Config,
        { record = true }: { record?: boolean } = {},
    ) {
        const updaters = createUpdaters(getEnabledApps(config.apps), theme.meta);

        if (updaters.length === 0 && !config.system_appearance) return;

        appStore.setState((s) => ({ ...s, applyingTheme: theme, phase: "applying" }));

        try {
            const results = await applyTheme(updaters, (partial) => {
                appStore.setState((s) => ({ ...s, updaterResults: partial }));
            });
            let applied = results.filter(themeWasApplied).length;

            if (config.system_appearance) {
                const result = await commands
                    .updateSystemAppearance(theme.meta.appearance)
                    .catch((error) => commandErrorResult(SYSTEM_APPEARANCE_APP, error));
                appStore.setState((s) => ({
                    ...s,
                    updaterResults: [...s.updaterResults, result],
                }));
                if (themeWasApplied(result)) applied += 1;
            }

            // One updater landing is enough to change what the user is looking
            // at, so the record follows the machine. A run that only skipped or
            // errored wrote nothing, and leaves the record standing.
            if (record && applied > 0) {
                try {
                    await activeTheme.set.mutateAsync(theme.meta.key);
                } catch (error) {
                    appStore.setState((s) => ({
                        ...s,
                        updaterResults: [
                            ...s.updaterResults.filter(
                                (result) => result.app !== ACTIVE_THEME_PERSISTENCE_APP,
                            ),
                            activeThemePersistenceError(error),
                        ],
                    }));
                }
            }
        } finally {
            appStore.setState((s) => ({ ...s, phase: "done" }));
        }
    };
}
