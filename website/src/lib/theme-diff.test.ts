import { describe, expect, it } from "vite-plus/test";
import { themeCatalog } from "@black-atom/core";
import { changedTokens } from "./theme-diff.ts";

const theme = themeCatalog["black-atom-jpn-murasaki-dark"];

describe("changedTokens", () => {
    it("finds nothing between a theme and itself", () => {
        expect(changedTokens(theme, theme)).toEqual([]);
    });

    it("lists a token whose color changed, with both colors", () => {
        const before = {
            ...theme,
            ui: { ...theme.ui, fg: { ...theme.ui.fg, border: theme.ui.fg.subtle } },
        };

        expect(changedTokens(before, theme)).toEqual([
            { path: "ui.fg.border", before: theme.ui.fg.subtle, after: theme.ui.fg.border },
        ]);
    });

    it("lists a nested syntax token by its full path", () => {
        const before = {
            ...theme,
            syntax: {
                ...theme.syntax,
                comment: { ...theme.syntax.comment, default: theme.syntax.string.default },
            },
        };

        expect(changedTokens(before, theme).map((token) => token.path)).toEqual([
            "syntax.comment.default",
        ]);
    });
});
