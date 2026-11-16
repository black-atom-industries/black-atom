import { createContext, use } from "react";
import type * as Theme from "@black-atom/core";
import { describeSource, type SourceLine } from "#/lib/describe-source.ts";

/** The sources of the theme a page shows, so every color below it can name where it comes from. */
export const ColorSources = createContext<Theme.Sources>({});

/** Where the color at `path` comes from, such as `palette.green`; nothing for a color typed in the theme. */
export function useColorSource(path: string | undefined): SourceLine | undefined {
    const sources = use(ColorSources);
    return path === undefined ? undefined : describeSource(sources, path);
}
