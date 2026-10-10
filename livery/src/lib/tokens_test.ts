import { assert, test } from "vitest";
import { themeCatalog } from "@black-atom/core";
import { themeToCustomProperties, themeToStyleSheet } from "./tokens.ts";

const theme = themeCatalog["black-atom-jpn-koyo-dark"];

test("themeToCustomProperties maps the theme's UI palette onto --ba-* roles", () => {
    const props = themeToCustomProperties(theme);

    assert.deepEqual(props["--ba-color-bg-default"], theme.ui.bg.default);
    assert.deepEqual(props["--ba-color-bg-subtle"], theme.ui.bg.panel);
    assert.deepEqual(props["--ba-color-bg-hint"], theme.ui.bg.active);
    assert.deepEqual(props["--ba-color-bg-recessed"], theme.ui.bg.float);
    assert.deepEqual(props["--ba-color-bg-contrast"], theme.ui.bg.contrast);
    assert.deepEqual(props["--ba-color-fg-default"], theme.ui.fg.default);
    assert.deepEqual(props["--ba-color-fg-positive"], theme.ui.fg.positive);
    assert.deepEqual(props["--ba-color-fg-negative"], theme.ui.fg.negative);
});

test("themeToCustomProperties does not emit derived tokens (borders, focus)", () => {
    const emitted = Object.keys(themeToCustomProperties(theme));

    // Borders and focus derive from fg tokens via color-mix in the static
    // layer — emitting them would break automatic re-tinting.
    assert.deepEqual(emitted.filter((name) => name.includes("border")), []);
    assert.deepEqual(emitted.filter((name) => name.includes("focus")), []);
});

test("themeToStyleSheet emits a :root block with color-scheme and declarations", () => {
    const sheet = themeToStyleSheet(theme);

    assert.match(sheet, /^:root \{\n/);
    assert.include(sheet, `color-scheme: ${theme.meta.appearance};`);
    assert.include(sheet, `--ba-color-bg-default: ${theme.ui.bg.default};`);
});

test("light themes emit color-scheme: light", () => {
    const light = themeCatalog["black-atom-terra-spring-light"];

    assert.include(themeToStyleSheet(light), "color-scheme: light;");
});
