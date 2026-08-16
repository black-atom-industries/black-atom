import { useQuery } from "@tanstack/react-query";
import { commands } from "../bindings.ts";

const TOPIC = "app-status" as const;
const queryKey = () => [TOPIC] as const;

/**
 * Per-adapter setup state — provisioning class, editable config fields, and
 * whether the Linked placement is wired on disk. Linking changes it, so
 * callers refetch after a SET UP or LINK THEMES run.
 */
export const useAppStatus = () => {
    const query = useQuery({
        queryKey: queryKey(),
        queryFn: () => commands.getAppStatus(),
        staleTime: Infinity,
    });

    return { query };
};
