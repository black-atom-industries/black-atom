import { productKeys } from "#/content/products/types.ts";

/** A landmark in the background space. */
export type LandmarkKey = "hole" | "iter" | "radar";

/**
 * What the background shows on a route: one landmark or the wide shot of all three, full or
 * receded behind the page's text. A wide shot may drift toward one landmark.
 */
export interface BackgroundState {
    view: LandmarkKey | "wide";
    mode: "full" | "receded";
    focus?: LandmarkKey;
}

const statesByPath: Record<string, BackgroundState> = {
    "/": { view: "hole", mode: "full" },
    "/black-atom": { view: "hole", mode: "full" },
    "/black-atom/livery": { view: "hole", mode: "full" },
    "/iter": { view: "iter", mode: "full" },
    "/radar": { view: "radar", mode: "full" },
    "/changelog": { view: "wide", mode: "full" },
    "/about": { view: "wide", mode: "full" },
};

const landmarksByProduct: Record<(typeof productKeys)[number], LandmarkKey> = {
    "black-atom": "hole",
    livery: "hole",
    iter: "iter",
    radar: "radar",
};

function isProductKey(value: unknown): value is (typeof productKeys)[number] {
    return productKeys.some((key) => key === value);
}

/** The changelog's `product` search param, when it names a product. */
export function productParam(search: unknown): (typeof productKeys)[number] | undefined {
    if (typeof search !== "object" || search === null || !("product" in search)) return undefined;
    return isProductKey(search.product) ? search.product : undefined;
}

export function backgroundStateFor(pathname: string, product?: string): BackgroundState {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    if (path === "/changelog" && isProductKey(product)) {
        return { view: "wide", mode: "full", focus: landmarksByProduct[product] };
    }
    if (path.startsWith("/black-atom/themes/")) return { view: "hole", mode: "receded" };
    return statesByPath[path] ?? { view: "wide", mode: "receded" };
}

/** A short name for a state, equal for equal states: `hole`, `wide-receded`, `wide-radar`. */
export function backgroundStateKey({ view, mode, focus }: BackgroundState): string {
    return [view, mode === "receded" ? "receded" : undefined, focus]
        .filter((part) => part !== undefined)
        .join("-");
}
