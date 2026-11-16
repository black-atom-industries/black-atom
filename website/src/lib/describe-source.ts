import type * as Theme from "@black-atom/core";

/** `is` follows references down to the slot typed in the theme; `from` lists the slots a color is computed from. */
export type SourceLine = { label: "is" | "from"; paths: string[] };

/**
 * Where a color comes from, for a token card: the chain of references down to the slot typed in
 * the theme (`is feedback.success = palette.green`), or the slots it is computed from.
 */
export function describeSource(sources: Theme.Sources, path: string): SourceLine | undefined {
    const source = sources[path];
    if (source === undefined) return undefined;
    if ("from" in source) return { label: "from", paths: source.from };

    const paths = [source.ref];
    for (let next = sources[source.ref]; next && "ref" in next; next = sources[next.ref]) {
        paths.push(next.ref);
    }
    return { label: "is", paths };
}
