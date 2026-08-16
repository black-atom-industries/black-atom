import { useMutation, useQuery } from "@tanstack/react-query";
import { commands } from "../bindings.ts";

const TOPIC = "themes-status" as const;
const queryKey = (keys: string[] = []) => [TOPIC, ...keys] as const;

/**
 * Managed themes manifest state — drives the first-run greeting gate and
 * the settings SYNC display. Downloads themselves run via the sequential
 * runner in lib/theme-downloads.ts (mirroring applyTheme), so callers
 * refetch this query when a pass completes.
 */
export const useThemesStatus = () => {
    const query = useQuery({
        queryKey: queryKey(),
        queryFn: () => commands.getThemesStatus(),
        staleTime: Infinity, // Changes only via our own download/dismiss actions
    });

    // mutationKey ["themes-status", "dismiss"] — MutationCache auto-invalidates
    // all ["themes-status", ...] queries
    const dismiss = useMutation({
        mutationKey: queryKey(["dismiss"]),
        mutationFn: async () => {
            const result = await commands.dismissThemesGreeting();
            if (result.status === "error") throw new Error(result.error);
            return null;
        },
    });

    return { query, dismiss };
};
