import type {
    ThemeAccentColors,
    ThemeDefinition,
    ThemeFeedbackColors,
    ThemePrimaryColors,
} from "../../types/theme.ts";
import { themeKeyMetaMap } from "../../types/themes.ts";
import { oklch } from "../../utils/color.ts";

import createFeedback from "./create-feedback-light.ts";
import createPalette from "./create-palette-light.ts";
import createSyntax from "./create-syntax-light.ts";
import createUi from "./create-ui-light.ts";

const meta = themeKeyMetaMap["black-atom-paper-blue-light"];

const primaries: ThemePrimaryColors = {
    d10: oklch(0.24, 0.20, 265),
    d20: oklch(0.28, 0.20, 265),
    d30: oklch(0.34, 0.20, 265),
    d40: oklch(0.42, 0.20, 265),

    m10: oklch(0.50, 0.20, 265),
    m20: oklch(0.58, 0.20, 265),
    m30: oklch(0.62, 0.20, 265),
    m40: oklch(0.68, 0.20, 265),

    l10: oklch(0.90, 0.010, 265),
    l20: oklch(0.93, 0.010, 265),
    l30: oklch(0.97, 0.010, 265),
    l40: oklch(0.99, 0.010, 265),
};

const accents: ThemeAccentColors = {
    a10: oklch(0.55, 0.25, 265),
    a20: oklch(0.45, 0.25, 265),
};

const palette = createPalette(primaries);

const feedback: ThemeFeedbackColors = createFeedback(accents);
const options = { primaries, palette, feedback, accents };
const ui = createUi(options);
const syntax = createSyntax(options);

const theme: ThemeDefinition = {
    meta,
    primaries,
    palette,
    accents,
    feedback,
    ui,
    syntax,
};

export default theme;
