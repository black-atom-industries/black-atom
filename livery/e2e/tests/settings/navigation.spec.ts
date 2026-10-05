import { expect, settingsField, test } from "../../lib/e2e.ts";

test("s opens settings from the theme list, Escape walks back", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("option", { selected: true })).toBeVisible();

    await page.keyboard.press("s");
    await expect(page.getByRole("button", { name: "AUTO-DETECT" })).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/settings\/adapters\/delta$/);
    await expect(page.getByRole("switch")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/settings\/adapters$/);
    await expect(page.getByRole("button", { name: "AUTO-DETECT" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/$/);
});

test("j/k cycle adapters, Enter focuses the first field", async ({ page }) => {
    await page.goto("/settings/adapters/delta");
    await expect(page.getByRole("switch")).toBeVisible();

    await page.keyboard.press("j");
    await expect(page).toHaveURL(/\/settings\/adapters\/ghostty$/);
    await page.keyboard.press("k");
    await expect(page).toHaveURL(/\/settings\/adapters\/delta$/);

    await page.keyboard.press("Enter");
    await expect(settingsField(page, "CONFIG_PATH")).toBeFocused();
});

test("j/k cycle GENERAL and ADAPTERS at the root", async ({ page }) => {
    await page.goto("/settings/adapters");
    await expect(page.getByRole("button", { name: "AUTO-DETECT" })).toBeVisible();

    await page.keyboard.press("k");
    await expect(page).toHaveURL(/\/settings\/general$/);
    await expect(page.getByText("FOLLOW OS APPEARANCE")).toBeVisible();
    await page.keyboard.press("j");
    await expect(page).toHaveURL(/\/settings\/adapters$/);
});
