const backgroundStates = ["full", "receded", "iter", "radar"] as const;

export type BackgroundState = (typeof backgroundStates)[number];

const statesByPath: Record<string, BackgroundState> = {
    "/": "full",
    "/black-atom": "full",
    "/black-atom/livery": "full",
    "/iter": "iter",
    "/radar": "radar",
};

export function backgroundStateFor(pathname: string): BackgroundState {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    return statesByPath[path] ?? "receded";
}
