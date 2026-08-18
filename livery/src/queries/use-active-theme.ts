import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type ThemeKey, themeMap } from "@black-atom/core";
import { commands } from "../bindings.ts";

const TOPIC = "active-theme" as const;
const queryKey = (keys: string[] = []) => [TOPIC, ...keys] as const;

/** A stored key outlives a theme rename, so the catalogue is the authority. */
const isThemeKey = (key: string): key is ThemeKey => Object.hasOwn(themeMap, key);

/**
 * The theme livery last applied. Seeded by `livery setup`, rewritten by every
 * apply that wrote something. A stored key survives a theme rename, so it is
 * resolved against the catalogue here and a miss reads as no active theme.
 */
export const useActiveTheme = () => {
    // The CLI writes the same record from another process, so this is the one
    // query livery does not own outright. Refetching on focus is what picks up
    // a `livery apply` run in a terminal while the window sat open.
    const query = useQuery({
        queryKey: queryKey(),
        queryFn: () => commands.getActiveTheme(),
        refetchOnWindowFocus: true,
    });

    const theme = useMemo(() => {
        const key = query.data;
        if (!key || !isThemeKey(key)) return null;
        return themeMap[key];
    }, [query.data]);

    // mutationKey ["active-theme", "set"] — MutationCache auto-invalidates all
    // ["active-theme", ...] queries
    const set = useMutation({
        mutationKey: queryKey(["set"]),
        mutationFn: async (key: string) => {
            const result = await commands.setActiveTheme(key);
            if (result.status === "error") throw new Error(result.error);
        },
    });

    return { query, theme, set };
};
