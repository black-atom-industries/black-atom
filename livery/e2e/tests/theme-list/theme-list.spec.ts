import { expect, test, themeRow } from "../../lib/e2e.ts";

test("opens with the cursor on the active theme", async ({ page }) => {
    await page.goto("/");

    const selected = page.getByRole("option", { selected: true });
    await expect(selected).toHaveCount(1);
    await expect(selected).toContainText("Dimmed Dark");
    await expect(selected).toContainText("ACTIVE");
});

test("search narrows the list by name", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("option", { selected: true })).toBeVisible();
    await page.keyboard.press("/");
    await page.keyboard.type("dimmed light");

    const names = await page.getByRole("option").allInnerTexts();
    expect(names.length).toBeGreaterThan(1);
    for (const name of names) expect(name).toContain("Dimmed Light");

    await page.keyboard.press("Escape");
    await expect(page.getByRole("option")).not.toHaveCount(names.length);
});

test("collection and appearance chips combine", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "DEFAULT", exact: true }).click();
    await page.getByRole("button", { name: "○ LIGHT", exact: true }).click();

    await expect(page.getByRole("option")).toHaveCount(2);
    await expect(themeRow(page, "Light")).toBeVisible();
    await expect(themeRow(page, "Dimmed Light")).toBeVisible();
});

test("j/k, gg and G move the cursor", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "DEFAULT", exact: true }).click();
    const rows = page.getByRole("option");
    await rows.first().click();
    await page.locator("body").focus();

    await page.keyboard.press("j");
    await expect(rows.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("k");
    await expect(rows.nth(0)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Shift+G");
    await expect(rows.last()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("g");
    await page.keyboard.press("g");
    await expect(rows.first()).toHaveAttribute("aria-selected", "true");
});

test("matches the theme list baseline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("option", { selected: true })).toContainText("Dimmed Dark");
    await expect(page).toHaveScreenshot("theme-list.png");
});
