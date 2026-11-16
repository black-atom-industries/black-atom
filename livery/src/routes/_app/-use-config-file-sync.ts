import { useEffect, useEffectEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { themeCatalog } from "@black-atom/core";
import { commands, type ConfigFileChanged, events } from "../../bindings.ts";
import { createLatestWinsQueue } from "../../lib/latest-wins-queue.ts";
import { isThemeKey, queryKey as activeThemeKey } from "../../queries/use-active-theme.ts";
import { queryKey as appStatusKey } from "../../queries/use-app-status.ts";
import { queryKey as nvimOverridesKey } from "../../queries/use-nvim-overrides.ts";
import { fileErrorQueryKey, queryKey as configKey } from "../../queries/use-config.ts";
import { appStore } from "../../store/app.ts";
import { useRunApply } from "./-use-run-apply.ts";

/**
 * Follows the config file: the app shows what it holds, running Neovims reload
 * when their options changed, and a changed theme applies like one picked here.
 * Mount it once. A second mount would apply every change twice.
 */
export function useConfigFileSync() {
    const queryClient = useQueryClient();
    const runApply = useRunApply();
    const phase = useStore(appStore, (s) => s.phase);
    const [applies] = useState(() =>
        createLatestWinsQueue(() => appStore.state.phase === "applying"),
    );

    useEffect(() => {
        applies.drain();
    }, [applies, phase]);

    const onChanged = useEffectEvent(({ error, ...change }: ConfigFileChanged) => {
        queryClient.setQueryData(fileErrorQueryKey(), error);
        if (error !== null) return;

        void queryClient.invalidateQueries({ queryKey: configKey() });
        void queryClient.invalidateQueries({ queryKey: activeThemeKey() });
        void queryClient.invalidateQueries({ queryKey: appStatusKey() });
        void queryClient.invalidateQueries({ queryKey: nvimOverridesKey() });

        if (change.nvim_settings_changed) {
            void commands.reloadNvim().then((result) => {
                if (result.status === "error") console.error(result.message);
            });
        }
        if (change.active_theme_changed) {
            const key = change.active_theme;
            if (key !== null && isThemeKey(key)) {
                appStore.setState((s) => ({ ...s, followThemeKey: key }));
                applies.submit(async () => {
                    await runApply(themeCatalog[key], await commands.getConfig(), {
                        record: false,
                    });
                });
            }
        }
    });

    useEffect(() => {
        const listening = events.configFileChanged.listen(({ payload }) => onChanged(payload));
        return () => {
            void listening.then((unlisten) => unlisten());
        };
    }, []);
}
