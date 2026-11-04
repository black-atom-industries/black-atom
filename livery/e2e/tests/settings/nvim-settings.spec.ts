import { existsSync } from "node:fs";
import { homePath, readLiveryConfig } from "../../lib/fixture-home.ts";
import { expect, test } from "../../lib/e2e.ts";

test("SAVE SETTINGS stores the options in Livery's config and touches no Neovim file", async ({
    page,
}) => {
    await page.goto("/settings/adapters/nvim");
    await expect(page.getByText("CONFIG_PATH", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Running Neovims reload on save.", { exact: false })).toBeVisible();

    const row = page
        .locator("div")
        .filter({ has: page.getByText("ENDING_TILDES", { exact: true }) })
        .filter({ has: page.getByRole("switch") })
        .last();
    await row.getByRole("switch").click();
    await page.getByRole("button", { name: "SAVE SETTINGS" }).click();

    await expect
        .poll(() => readLiveryConfig().apps.nvim?.settings?.styles.ending_tildes)
        .toBe(true);
    await expect(
        page.getByText("running instances were not reloaded", { exact: false }),
    ).toBeVisible();
    expect(existsSync(homePath("~/.config/nvim"))).toBe(false);
});

test("SET UP links the plugin with no Neovim config to point at", async ({ page }) => {
    await page.goto("/settings/adapters/nvim");
    await page.getByRole("button", { name: "SET UP" }).click();

    await expect.poll(() => readLiveryConfig().apps.nvim?.enabled).toBe(true);
    await expect
        .poll(() =>
            existsSync(homePath("~/.local/share/nvim/site/pack/black-atom/start/black-atom")),
        )
        .toBe(true);
    expect(existsSync(homePath("~/.config/nvim"))).toBe(false);
    expect(readLiveryConfig().apps.nvim.config_path).toBeUndefined();
});
