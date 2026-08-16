import { assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import { themeMap } from "@black-atom/core";
import { themeToCustomProperties, themeToStyleSheet } from "./tokens.ts";

const theme = themeMap["black-atom-jpn-koyo-yoru"];

Deno.test("themeToCustomProperties maps the theme's UI palette onto --ba-* roles", () => {
    const props = themeToCustomProperties(theme);

    assertEquals(props["--ba-color-bg-default"], theme.ui.bg.default);
    assertEquals(props["--ba-color-bg-subtle"], theme.ui.bg.panel);
    assertEquals(props["--ba-color-bg-hint"], theme.ui.bg.active);
    assertEquals(props["--ba-color-bg-recessed"], theme.ui.bg.float);
    assertEquals(props["--ba-color-bg-contrast"], theme.ui.bg.contrast);
    assertEquals(props["--ba-color-fg-default"], theme.ui.fg.default);
    assertEquals(props["--ba-color-fg-positive"], theme.ui.fg.positive);
    assertEquals(props["--ba-color-fg-negative"], theme.ui.fg.negative);
});

Deno.test("themeToCustomProperties does not emit derived tokens (borders, focus)", () => {
    const emitted = Object.keys(themeToCustomProperties(theme));

    // Borders and focus derive from fg tokens via color-mix in the static
    // layer — emitting them would break automatic re-tinting.
    assertEquals(emitted.filter((name) => name.includes("border")), []);
    assertEquals(emitted.filter((name) => name.includes("focus")), []);
});

Deno.test("themeToStyleSheet emits a :root block with color-scheme and declarations", () => {
    const sheet = themeToStyleSheet(theme);

    assertMatch(sheet, /^:root \{\n/);
    assertStringIncludes(sheet, `color-scheme: ${theme.meta.appearance};`);
    assertStringIncludes(sheet, `--ba-color-bg-default: ${theme.ui.bg.default};`);
});

Deno.test("light themes emit color-scheme: light", () => {
    const light = themeMap["black-atom-terra-spring-day"];

    assertStringIncludes(themeToStyleSheet(light), "color-scheme: light;");
});
