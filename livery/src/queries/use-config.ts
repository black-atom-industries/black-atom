import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type AppConfig, type AppName, commands, type Config } from "../bindings.ts";

const TOPIC = "config" as const;
const queryKey = (keys: string[] = []) => [TOPIC, ...keys] as const;

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

    // mutationKey ["config", "save"] — MutationCache auto-invalidates all ["config", ...] queries
    const save = useMutation({
        mutationKey: queryKey(["save"]),
        mutationFn: (config: Config) => commands.saveConfig(config),
    });

    return {
        query,
        enabledApps,
        save,
    };
};
