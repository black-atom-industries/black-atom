import { readLiveryConfig } from "../../lib/fixture-home.ts";
import { expect, test } from "../../lib/e2e.ts";

test("lists the configured config folders and verifies each", async ({ page }) => {
    await page.goto("/settings/adapters/claude-code");

    await expect(page.getByText("CONFIG FOLDERS · 1 CONFIGURED")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ ADD CONFIG FOLDER" })).toBeVisible();

    await page.getByRole("button", { name: "VERIFY PATH" }).click();
    await expect(page.getByText("· VERIFIED")).toBeVisible();
});

test("REMOVE drops a config folder from the config", async ({ page }) => {
    await page.goto("/settings/adapters/claude-code");

    await page.getByRole("button", { name: "REMOVE" }).click();

    await expect.poll(() => readLiveryConfig().apps["claude-code"].config_folders).toEqual([]);
    await expect(page.getByText("CONFIG FOLDERS · 0 CONFIGURED")).toBeVisible();
});
