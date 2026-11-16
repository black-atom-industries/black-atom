import type * as Theme from "../types/theme.ts";

/** Two markers far apart in hue, so a creator that reads only a color's hue still reacts. */
const MARKERS = ["#ff00ff", "#00ff00"];

function leaves(value: unknown, path: string, out = new Map<string, string>()) {
    if (typeof value === "string") out.set(path, value);
    else if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) leaves(child, `${path}.${key}`, out);
    }
    return out;
}

/**
 * Finds which context slots each of a creator's outputs comes from, by rerunning the creator with
 * one slot at a time swapped for a marker. An output that turns into the marker is that slot; one
 * that only changes is derived from it.
 */
export function traceSources<C extends object>(
    layer: string,
    create: (context: C) => unknown,
    context: C,
): Theme.Sources {
    const base = leaves(create(context), layer);
    const inputs = new Map<string, Set<string>>();
    const markerHits = new Map<string, Map<string, number>>();

    for (const [group, slots] of Object.entries(context) as [string, object][]) {
        for (const slot of Object.keys(slots)) {
            const input = `${group}.${slot}`;
            for (const marker of MARKERS) {
                const probed = leaves(
                    create({ ...context, [group]: { ...slots, [slot]: marker } }),
                    layer,
                );
                for (const [path, value] of probed) {
                    if (value === base.get(path)) continue;
                    inputs.set(path, (inputs.get(path) ?? new Set()).add(input));
                    if (value !== marker) continue;
                    const hits = markerHits.get(path) ?? new Map<string, number>();
                    markerHits.set(path, hits.set(input, (hits.get(input) ?? 0) + 1));
                }
            }
        }
    }

    const sources: Theme.Sources = {};
    for (const [path, from] of inputs) {
        const ref = [...(markerHits.get(path) ?? [])].find(([, n]) => n === MARKERS.length)?.[0];
        sources[path] = ref !== undefined && from.size === 1 ? { ref } : { from: [...from] };
    }
    return sources;
}
