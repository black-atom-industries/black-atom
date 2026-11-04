import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Page } from "@playwright/test";
import { homePath, readLiveryConfig } from "../../lib/fixture-home.ts";
import { expect, test } from "../../lib/e2e.ts";

test("SAVE SETTINGS stores the options in Livery's config and touches no Neovim file", async ({
    page,
}) => {
    await page.goto("/settings/adapters/nvim");
    await expect(page.getByText("CONFIG_PATH", { exact: true })).toHaveCount(0);
    await expect(
        page.getByText("each running Neovim re-applies its current Black Atom theme", {
            exact: false,
        }),
    ).toBeVisible();

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

function tildesSwitch(page: Page) {
    return page
        .locator("div")
        .filter({ has: page.getByText("ENDING_TILDES", { exact: true }) })
        .filter({ has: page.getByRole("switch") })
        .last()
        .getByRole("switch");
}

function writeNvimConfig(file: string, content: string) {
    const path = homePath(`~/.config/nvim/${file}`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
}

test("an options override in the Neovim config makes the panel read-only", async ({ page }) => {
    writeNvimConfig("init.lua", "vim.opt.number = true\nvim.g.black_atom_core_config = {}\n");
    await page.goto("/settings/adapters/nvim");

    const note = page.getByTestId("nvim-options-override");
    await expect(note).toContainText("init.lua:2");
    await expect(tildesSwitch(page)).toBeDisabled();
    await expect(page.getByRole("radio", { name: "FULL", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "SAVE SETTINGS" })).toHaveCount(0);

    writeNvimConfig("init.lua", "vim.opt.number = true\n");
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(note).toHaveCount(0);
    await expect(tildesSwitch(page)).toBeEnabled();
    await expect(page.getByRole("button", { name: "SAVE SETTINGS" })).toBeVisible();
});

test("a colorscheme line in the Neovim config gets a note and leaves the panel editable", async ({
    page,
}) => {
    writeNvimConfig("plugin/theme.lua", 'vim.cmd.colorscheme("black-atom-jpn-koyo-dark")\n');
    await page.goto("/settings/adapters/nvim");

    await expect(page.getByTestId("nvim-colorscheme-override")).toContainText("theme.lua:1");
    await expect(page.getByTestId("nvim-options-override")).toHaveCount(0);
    await expect(tildesSwitch(page)).toBeEnabled();
});
