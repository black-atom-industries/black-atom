import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    type AppConfig,
    type AppName,
    commands,
    type Config,
    type NvimSettings,
    type Result,
} from "../bindings.ts";

const TOPIC = "config" as const;
export const queryKey = (keys: string[] = []) => [TOPIC, ...keys] as const;
export const fileErrorQueryKey = () => queryKey(["file-error"]);

type ConfigChange = (config: Config) => Config;

let configWriteQueue = Promise.resolve();

function enqueueConfigWrite<T>(write: () => Promise<T>): Promise<T> {
    const next = configWriteQueue.then(write);
    configWriteQueue = next.then(
        () => undefined,
        () => undefined,
    );
    return next;
}

export const useConfig = () => {
    const query = useQuery({
        queryKey: queryKey(),
        queryFn: () => commands.getConfig(),
        staleTime: Infinity, // Changes arrive through our own saves and the config file listener
    });

    const enabledApps = useMemo(
        function getEnabledApps() {
            return (Object.entries(query.data?.apps ?? {}) as [AppName, AppConfig][])
                .filter(([_, cfg]) => cfg.enabled !== false)
                .map(([name]) => name);
        },
        [query.data],
    );

    /** Apply a change to a freshly read config, serialized with every config write. */
    const saveLatest = (change: ConfigChange): Promise<Result<null, string>> =>
        enqueueConfigWrite(async () => {
            const latest = await commands.getConfig();
            const result = await commands.saveConfig(change(latest));
            if (result.status === "error") throw new Error(result.error);
            await query.refetch();
            return result;
        });

    // Same ["config", ...] topic, so the MutationCache refetches the config
    // query on success.
    const saveNvimSettings = useMutation({
        mutationKey: queryKey(["nvim-settings"]),
        mutationFn: async (settings: NvimSettings) => {
            await saveLatest((latest) => ({
                ...latest,
                apps: { ...latest.apps, nvim: { ...latest.apps.nvim, settings } },
            }));
            return commands.reloadNvim();
        },
    });

    return {
        query,
        enabledApps,
        saveLatest,
        saveNvimSettings,
    };
};

/** Why the config file can't be read right now, `null` while it's good. */
export const useConfigFileError = () =>
    useQuery({
        queryKey: fileErrorQueryKey(),
        queryFn: () => commands.getConfigFileError(),
        staleTime: Infinity,
    });
