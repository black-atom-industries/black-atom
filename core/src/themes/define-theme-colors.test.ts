import { assert, test } from "vitest";
import type * as Theme from "../types/theme.ts";
import { themeCatalog } from "./catalog.ts";
import { defineThemeColors } from "./define-theme-colors.ts";

function selectColors(theme: Theme.Colors): Theme.Colors {
    const { primaries, accents, palette, feedback, ui, syntax } = theme;
    return { primaries, accents, palette, feedback, ui, syntax };
}

test("defineThemeColors resolves creators in dependency order", () => {
    const colors = selectColors(themeCatalog["black-atom-default-dark"]);
    const calls: string[] = [];

    defineThemeColors({
        primaries: colors.primaries,
        accents: (context) => {
            calls.push(Object.keys(context).join(","));
            return colors.accents;
        },
        palette: (context) => {
            calls.push(Object.keys(context).join(","));
            return colors.palette;
        },
        feedback: (context) => {
            calls.push(Object.keys(context).join(","));
            return colors.feedback;
        },
        ui: (context) => {
            calls.push(Object.keys(context).join(","));
            return colors.ui;
        },
        syntax: (context) => {
            calls.push(Object.keys(context).join(","));
            return colors.syntax;
        },
    });

    assert.deepEqual(calls, [
        "primaries",
        "primaries,accents",
        "primaries,accents,palette",
        "primaries,accents,palette,feedback",
        "primaries,accents,palette,feedback",
    ]);
});
