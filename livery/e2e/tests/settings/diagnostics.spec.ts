import { rmSync } from "node:fs";
import { homePath, readHomeFile, readLiveryConfig } from "../../lib/fixture-home.ts";
import { expect, settingsField, test } from "../../lib/e2e.ts";

test("VERIFY PATH confirms the file and pattern", async ({ page }) => {
    await page.goto("/settings/adapters/delta");
    await page.getByRole("button", { name: "VERIFY PATH" }).click();

    await expect(page.getByText("Path exists · pattern matches")).toBeVisible();
});

test("VERIFY PATH reports a missing file", async ({ page }) => {
    rmSync(homePath("~/.gitconfig.delta"));
    await page.goto("/settings/adapters/delta");
    await page.getByRole("button", { name: "VERIFY PATH" }).click();

    await expect(page.getByText("PATH NOT FOUND").first()).toBeVisible();
    await expect(page.getByRole("option").filter({ hasText: "delta" })).toContainText("CHECK");
});

test("VERIFY PATH reports a pattern that no longer matches", async ({ page }) => {
    await page.goto("/settings/adapters/delta");
    const pattern = settingsField(page, "MATCH_PATTERN");
    await pattern.fill("^nothing-matches$");
    await pattern.press("Enter");
    await expect.poll(() => readLiveryConfig().apps.delta.match_pattern).toBe("^nothing-matches$");
    await page.getByRole("button", { name: "VERIFY PATH" }).click();

    await expect(page.getByText("NO PATTERN MATCH").first()).toBeVisible();
});

test("TEST APPLY switches the file, then reverts it", async ({ page }) => {
    const before = readHomeFile("~/.config/zed/settings.json");
    await page.goto("/settings/adapters/zed");
    await page.getByRole("button", { name: "TEST APPLY" }).click();

    await expect(page.getByText(/^Applied .+, reverting shortly$/)).toBeVisible();
    expect(readHomeFile("~/.config/zed/settings.json")).not.toBe(before);

    await expect(page.getByText(/reverting shortly|Reverting/)).toHaveCount(0, {
        timeout: 10_000,
    });
    expect(readHomeFile("~/.config/zed/settings.json")).toBe(before);
});
