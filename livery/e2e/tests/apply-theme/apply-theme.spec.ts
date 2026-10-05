import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fixture } from "../../lib/environment.ts";
import { homePath, readHomeFile, readLiveryConfig } from "../../lib/fixture-home.ts";
import { expect, pickTheme, test, themeRow } from "../../lib/e2e.ts";

const dimmedLight = {
    key: "black-atom-default-dimmed-light",
    zedLabel: "Black Atom — Dimmed Light",
};

test("writes the theme into every enabled adapter", async ({ page }) => {
    await page.goto("/");
    const row = await pickTheme(page, "DEFAULT", "Dimmed Light");

    await test.step("apply with Enter", async () => {
        await row.press("Enter");
        await expect(page.locator("[data-component='apply-rail']")).toHaveAttribute(
            "data-kind",
            "clean",
        );
    });

    await expect.poll(() => readLiveryConfig().active_theme).toBe(dimmedLight.key);

    const zed = readHomeFile("~/.config/zed/settings.json");
    expect(zed).toContain(`"theme": "${dimmedLight.zedLabel}"`);
    expect(zed).toContain(`"ui_font_size": 15`);
    expect(zed).toContain("// Unrelated settings stay untouched");

    const delta = readHomeFile("~/.gitconfig.delta");
    expect(delta).toContain("features = black-atom-light");
    expect(delta).toContain("line-numbers = true");

    const managedTheme = join(
        fixture.dataHome,
        `black-atom/themes/lazygit/default/${dimmedLight.key}.yml`,
    );
    expect(existsSync(managedTheme)).toBe(true);
    const lazygit = readHomeFile("~/.config/lazygit/config.yml");
    expect(lazygit).toContain("showIcons: true");
    expect(lazygit).toContain("activeBorderColor");
});

test("leaves disabled adapters untouched", async ({ page }) => {
    const tuicrBefore = readHomeFile("~/.config/tuicr/config.toml");

    await page.goto("/");
    const row = await pickTheme(page, "DEFAULT", "Dimmed Light");
    await row.press("Enter");
    await expect(page.locator("[data-component='apply-rail']")).toHaveAttribute(
        "data-kind",
        "clean",
    );

    expect(readHomeFile("~/.config/tuicr/config.toml")).toBe(tuicrBefore);
});

test("moves the ACTIVE marker to the applied theme", async ({ page }) => {
    await page.goto("/");
    const row = await pickTheme(page, "DEFAULT", "Dimmed Light");
    await row.press("Enter");

    await expect(row).toContainText("ACTIVE");
    await expect(page.getByRole("option").filter({ hasText: "ACTIVE" })).toHaveCount(1);
    await expect(themeRow(page, "Dimmed Dark")).not.toContainText("ACTIVE");
});

test("reports a failing adapter and still applies the others", async ({ page }) => {
    rmSync(homePath("~/.config/zed/settings.json"));

    await page.goto("/");
    const row = await pickTheme(page, "DEFAULT", "Dimmed Light");
    await row.press("Enter");

    const rail = page.locator("[data-component='apply-rail']");
    await expect(rail).toHaveAttribute("data-kind", "error");
    await expect(rail).toContainText("1 ERROR");
    await expect(rail).toContainText("zed");

    expect(readHomeFile("~/.gitconfig.delta")).toContain("features = black-atom-light");
    await expect.poll(() => readLiveryConfig().active_theme).toBe(dimmedLight.key);
});

test("r retries the failed adapter", async ({ page }) => {
    const zedSettings = readHomeFile("~/.config/zed/settings.json");
    rmSync(homePath("~/.config/zed/settings.json"));

    await page.goto("/");
    const row = await pickTheme(page, "DEFAULT", "Dimmed Light");
    await row.press("Enter");
    const rail = page.locator("[data-component='apply-rail']");
    await expect(rail).toHaveAttribute("data-kind", "error");

    writeFileSync(homePath("~/.config/zed/settings.json"), zedSettings);
    await page.keyboard.press("r");

    await expect(rail).toHaveAttribute("data-kind", "clean");
    expect(readHomeFile("~/.config/zed/settings.json")).toContain(
        `"theme": "${dimmedLight.zedLabel}"`,
    );
});
