import { assert, test } from "vite-plus/test";
import type * as Theme from "../types/theme.ts";
import { themeCatalog } from "./catalog.ts";
import { defineThemeColors } from "./define-theme-colors.ts";

function selectColors(theme: Theme.Colors): Omit<Theme.Colors, "sources"> {
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

    assert.deepEqual(calls.slice(0, 5), [
        "primaries",
        "primaries,accents",
        "primaries,accents,palette",
        "primaries,accents,palette,feedback",
        "primaries,accents,palette,feedback",
    ]);
});

test("defineThemeColors traces each UI color to the slots it comes from", () => {
    const { sources } = themeCatalog["black-atom-jpn-murasaki-light"];

    assert.deepEqual(sources["ui.fg.positive"], { ref: "feedback.success" });
    assert.deepEqual(sources["feedback.success"], { ref: "palette.green" });
    assert.deepEqual(sources["ui.fg.disabled"], { ref: "primaries.m40" });
    assert.deepEqual(sources["ui.bg.negative"], { from: ["primaries.l30", "feedback.negative"] });
    assert.equal(sources["palette.green"], undefined);
});
