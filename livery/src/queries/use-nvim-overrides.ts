import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { commands } from "../bindings.ts";

const TOPIC = "nvim-overrides" as const;
export const queryKey = () => [TOPIC] as const;

/**
 * Lines of the user's Neovim config that override Livery. The files change
 * outside the app, so each window focus reads them again.
 */
export const useNvimOverrides = () => {
    const query = useQuery({
        queryKey: queryKey(),
        queryFn: () => commands.findNvimOverrides(),
        refetchOnWindowFocus: false,
    });

    const { refetch } = query;
    useEffect(() => {
        const onFocus = () => void refetch();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [refetch]);

    return query;
};
