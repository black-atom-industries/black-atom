/**
 * Reports WCAG contrast of the intended pairings for every theme.
 *
 * Usage:
 *   npm run contrast                    # one summary row per theme
 *   npm run contrast <theme-key>        # every pair of one theme
 */

import process from "node:process";
import { analyzeThemeContrast, INTENDED_PAIRINGS } from "../lib/contrast-analysis.ts";
import { WCAG_CONTRAST } from "../lib/wcag.ts";
import { themeCatalog, themeKeys } from "../themes/catalog.ts";
import type { CatalogThemeKey } from "../themes/catalog.ts";
import log from "../lib/log.ts";

const LOW = 3;

const themeKey = process.argv[2];

if (themeKey) {
    if (!themeKeys.includes(themeKey as CatalogThemeKey)) {
        log.error(`Unknown theme "${themeKey}"`);
        process.exit(1);
    }
    const analysis = analyzeThemeContrast(themeCatalog[themeKey as CatalogThemeKey]);
    for (const category of analysis.categories) {
        console.log(`\n${category.name}`);
        for (const pair of category.pairs) {
            const mark = pair.ratio < LOW ? "  <3" : "";
            console.log(
                `  ${pair.fg.key.padEnd(26)} ${pair.fg.color} on ${pair.bg.color}  ${pair.ratio.toFixed(1).padStart(4)}  ${pair.level}${mark}`,
            );
        }
    }
} else {
    const groups = (name: string) =>
        name === "Syntax" || name === "Terminal palette" ? name : "UI";
    console.log(
        `${"theme".padEnd(36)} ${"UI".padStart(5)} ${"syntax".padStart(7)} ${"ansi".padStart(5)}   <3  <4.5`,
    );
    for (const key of themeKeys) {
        const analysis = analyzeThemeContrast(themeCatalog[key]);
        const worst = new Map<string, number>();
        for (const category of analysis.categories) {
            const group = groups(category.name);
            for (const pair of category.pairs) {
                worst.set(group, Math.min(worst.get(group) ?? Infinity, pair.ratio));
            }
        }
        const pairs = analysis.categories.flatMap((c) => c.pairs);
        const below = (limit: number) => pairs.filter((p) => p.ratio < limit).length;
        console.log(
            `${key.padEnd(36)} ${worst.get("UI")!.toFixed(1).padStart(5)} ${worst.get("Syntax")!.toFixed(1).padStart(7)} ${worst.get("Terminal palette")!.toFixed(1).padStart(5)}  ${String(below(LOW)).padStart(3)}  ${String(below(WCAG_CONTRAST.AA)).padStart(4)}`,
        );
    }
    const total = INTENDED_PAIRINGS.flatMap((c) => c.pairs).length;
    console.log(`\nWorst ratio per group, and how many of ${total} pairs fall below 3 and 4.5.`);
}
