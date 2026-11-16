import { useMemo } from "react";
import { useLocation } from "@tanstack/react-router";
import {
    backgroundStateFor,
    productParam,
    type BackgroundState,
} from "#/lib/route-background-state.ts";

export function useRouteBackgroundState(): BackgroundState {
    const pathname = useLocation({ select: (location) => location.pathname });
    const product = useLocation({ select: (location) => productParam(location.search) });
    return useMemo(() => backgroundStateFor(pathname, product), [pathname, product]);
}
