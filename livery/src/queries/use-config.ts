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
const queryKey = (keys: string[] = []) => [TOPIC, ...keys] as const;

type ConfigChange = (config: Config) => Config;

let configWriteQueue = Promise.resolve();

function enqueueConfigWrite<T>(write: () => Promise<T>): Promise<T> {
    const next = configWriteQueue.then(write);
    configWriteQueue = next.then(() => undefined, () => undefined);
    return next;
}

export const useConfig = () => {
    const query = useQuery({
        queryKey: queryKey(),
        queryFn: () => commands.getConfig(),
        staleTime: Infinity, // Config only changes via our own save mutation
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

    // Neovim's plugin options are stored in config AND projected into a
    // managed Lua block, so the backend owns both halves — the frontend must
    // not saveConfig them separately. Same ["config", ...] topic, so the
    // MutationCache refetches the config query on success.
    const writeNvimSettings = useMutation({
        mutationKey: queryKey(["nvim-settings"]),
        mutationFn: (settings: NvimSettings) =>
            enqueueConfigWrite(() => commands.writeNvimSettings(settings)),
    });

    return {
        query,
        enabledApps,
        saveLatest,
        writeNvimSettings,
    };
};
