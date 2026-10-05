import { readLiveryConfig } from "../../lib/fixture-home.ts";
import { expect, test } from "../../lib/e2e.ts";

test("the switch disables and re-enables an adapter", async ({ page }) => {
    await page.goto("/settings/adapters/delta");
    const toggle = page.getByRole("switch");
    const sidebarRow = page.getByRole("option").filter({ hasText: "delta" });

    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(sidebarRow).toContainText("DISABLED");
    await expect.poll(() => readLiveryConfig().apps.delta.enabled).toBe(false);

    await toggle.click();
    await expect.poll(() => readLiveryConfig().apps.delta.enabled).toBe(true);
});

test("Space toggles the selected adapter", async ({ page }) => {
    await page.goto("/settings/adapters/tuicr");
    await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Space");

    await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => readLiveryConfig().apps.tuicr.enabled).toBe(true);
});

test("FOLLOW OS APPEARANCE is stored in the config", async ({ page }) => {
    await page.goto("/settings/general");
    await page.getByRole("switch").click();

    await expect.poll(() => readLiveryConfig().system_appearance).toBe(true);
});

test("matches the adapter page baseline", async ({ page }) => {
    await page.goto("/settings/adapters/delta");
    await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "true");

    await expect(page).toHaveScreenshot("delta-settings.png");
});
