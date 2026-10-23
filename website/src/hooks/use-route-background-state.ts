import { useLocation } from "@tanstack/react-router";
import { backgroundStateFor, type BackgroundState } from "#/lib/route-background-state.ts";

export function useRouteBackgroundState(): BackgroundState {
    return useLocation({ select: (location) => backgroundStateFor(location.pathname) });
}
