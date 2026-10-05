import { readLiveryConfig } from "../../lib/fixture-home.ts";
import { expect, settingsField, test } from "../../lib/e2e.ts";

test("saves CONFIG_PATH on Enter", async ({ page }) => {
    await page.goto("/settings/adapters/zed");
    const field = settingsField(page, "CONFIG_PATH");
    await field.fill("~/.config/zed/other.json");
    await field.press("Enter");

    await expect.poll(() => readLiveryConfig().apps.zed.config_path).toBe(
        "~/.config/zed/other.json",
    );
});

test("saves THEMES_PATH on blur", async ({ page }) => {
    await page.goto("/settings/adapters/lazygit");
    const field = settingsField(page, "THEMES_PATH");
    await field.fill("~/lazygit-themes");
    await field.blur();

    await expect.poll(() => readLiveryConfig().apps.lazygit.themes_path).toBe("~/lazygit-themes");
});

test("saves MATCH_PATTERN and REPLACE_TEMPLATE", async ({ page }) => {
    await page.goto("/settings/adapters/delta");
    const pattern = settingsField(page, "MATCH_PATTERN");
    await pattern.fill("features = .+");
    await pattern.press("Enter");
    const template = settingsField(page, "REPLACE_TEMPLATE");
    await template.fill("features = {themeKey}");
    await template.press("Enter");

    await expect.poll(() => readLiveryConfig().apps.delta).toMatchObject({
        match_pattern: "features = .+",
        replace_template: "features = {themeKey}",
    });
});

test("Escape reverts a dirty field without saving", async ({ page }) => {
    await page.goto("/settings/adapters/zed");
    const field = settingsField(page, "CONFIG_PATH");
    await field.fill("~/discarded.json");
    await field.press("Escape");

    await expect(field).toHaveValue("~/.config/zed/settings.json");
    expect(readLiveryConfig().apps.zed.config_path).toBe("~/.config/zed/settings.json");
});
