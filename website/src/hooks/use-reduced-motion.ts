import { useSyncExternalStore } from "react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
    const list = window.matchMedia(reducedMotionQuery);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(reducedMotionQuery).matches,
        () => false,
    );
}
