import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { homePath, readHomeFile, readLiveryConfig } from "../../lib/fixture-home.ts";
import { expect, test } from "../../lib/e2e.ts";

const initLua = "~/.config/nvim/init.lua";

test("SAVE SETTINGS writes the managed block and the config", async ({ page }) => {
    mkdirSync(dirname(homePath(initLua)), { recursive: true });
    writeFileSync(homePath(initLua), 'vim.g.mapleader = " "\n');

    await page.goto("/settings/adapters/nvim");
    const row = page.locator("div")
        .filter({ has: page.getByText("ENDING_TILDES", { exact: true }) })
        .filter({ has: page.getByRole("switch") })
        .last();
    await row.getByRole("switch").click();
    await page.getByRole("button", { name: "SAVE SETTINGS" }).click();

    await expect.poll(() => readHomeFile(initLua)).toContain("ending_tildes = true");
    expect(readHomeFile(initLua)).toContain('vim.g.mapleader = " "');
    expect(readHomeFile(initLua)).toContain("-- BEGIN BLACK ATOM LIVERY CONFIG");
    expect(readLiveryConfig().apps.nvim.settings?.styles.ending_tildes).toBe(true);
});
