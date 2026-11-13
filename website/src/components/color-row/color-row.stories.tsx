import { themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import { contrastRatio } from "#/lib/contrast-ratio.ts";
import { ColorRow } from "./color-row.tsx";

const theme = themeCatalog["black-atom-jpn-murasaki-dark"];

const meta = preview.meta({
    title: "Components/ColorRow",
    component: ColorRow,
    args: {
        name: "keyword",
        color: theme.syntax.keyword.default,
        on: theme.ui.bg.default,
        ratio: contrastRatio(theme.syntax.keyword.default, theme.ui.bg.default),
    },
    // The sample is the color under test, so axe's text-contrast check is off for the row.
    parameters: {
        a11y: {
            config: { rules: [{ id: "color-contrast", enabled: false }] },
        },
    },
});

export const Default = meta.story();

export const Dim = meta.story({
    args: {
        name: "comment",
        color: theme.syntax.comment.default,
        ratio: contrastRatio(theme.syntax.comment.default, theme.ui.bg.default),
    },
});
