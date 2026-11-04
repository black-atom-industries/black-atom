import type { Page } from "@playwright/test";
import type { Config } from "../../../src/bindings.ts";
import { invokeBridge } from "../../lib/bridge.ts";
import {
    readHomeFile,
    readLiveryConfigText,
    writeLiveryConfigText,
} from "../../lib/fixture-home.ts";
import { expect, pickTheme, test } from "../../lib/e2e.ts";

/** Longer than the watcher's debounce and the bridge's poll put together. */
const SETTLE_MS = 1000;
const ENABLED_ADAPTERS = 4;
const DIMMED_LIGHT = "black-atom-default-dimmed-light";
const SECOND_THEME = { key: "black-atom-default-light", zedLabel: "Black Atom — Light" };

/** Open a page and wait until it listens for config file changes. */
async function openListening(page: Page, url: string) {
    const listening = page.waitForResponse((r) => r.url().endsWith("/config_file_events"));
    await page.goto(url);
    await listening;
}

/** Every call the page makes to a backend command, counted from now on. */
function countCalls(page: Page, command: string) {
    const calls: string[] = [];
    page.on("request", (request) => {
        if (request.url().endsWith(`/__livery/invoke/${command}`)) calls.push(request.url());
    });
    return calls;
}

function toggleRow(page: Page, label: string) {
    return page
        .locator("div")
        .filter({ has: page.getByText(label, { exact: true }) })
        .filter({ has: page.getByRole("switch") })
        .last()
        .getByRole("switch");
}

test.describe("the nvim settings page", () => {
    const edit = async (
        request: Parameters<typeof invokeBridge>[0],
        change: (config: Config) => void,
    ) => {
        const config = await invokeBridge<Config>(request, "get_config");
        change(config);
        writeLiveryConfigText(JSON.stringify(config, null, 4));
    };
    const toggleEndingTildes = (config: Config) => {
        const options = config.apps.nvim?.settings;
        if (!options) throw new Error("The merged config carries nvim settings");
        options.ending_tildes = !options.ending_tildes;
    };

    test("follows an edit of the file and reloads Neovims once", async ({ page, request }) => {
        await openListening(page, "/settings/adapters/nvim");
        const toggle = toggleRow(page, "ENDING_TILDES");
        await expect(toggle).toHaveAttribute("aria-checked", "false");
        const reloads = countCalls(page, "reload_nvim");

        await edit(request, toggleEndingTildes);

        await expect(toggle).toHaveAttribute("aria-checked", "true");
        await expect(page.getByText("UNSAVED")).toHaveCount(0);
        await page.waitForTimeout(SETTLE_MS);
        expect(reloads).toHaveLength(1);
    });

    test("keeps an unsaved draft when the file changes underneath", async ({ page, request }) => {
        await openListening(page, "/settings/adapters/nvim");
        await toggleRow(page, "DARK_FLOATS").click();
        const draftChecked = await toggleRow(page, "DARK_FLOATS").getAttribute("aria-checked");
        await expect(page.getByText("UNSAVED")).toBeVisible();
        const reloads = countCalls(page, "reload_nvim");

        await edit(request, toggleEndingTildes);

        await expect.poll(() => reloads.length).toBe(1);
        await expect(toggleRow(page, "DARK_FLOATS")).toHaveAttribute(
            "aria-checked",
            draftChecked ?? "",
        );
        await expect(page.getByText("UNSAVED")).toBeVisible();
    });

    test("a save of its own reloads Neovims once", async ({ page }) => {
        await openListening(page, "/settings/adapters/nvim");
        const reloads = countCalls(page, "reload_nvim");

        await toggleRow(page, "ENDING_TILDES").click();
        await page.getByRole("button", { name: "SAVE SETTINGS" }).click();
        await expect.poll(() => reloads.length).toBe(1);
        await expect(page.getByText("UNSAVED")).toHaveCount(0);

        await page.waitForTimeout(SETTLE_MS);
        expect(reloads).toHaveLength(1);
    });

    test("a broken file keeps its values, says so, and survives a save", async ({ page }) => {
        await openListening(page, "/settings/adapters/nvim");
        const good = readLiveryConfigText();
        const toggle = toggleRow(page, "DARK_FLOATS");
        const before = await toggle.getAttribute("aria-checked");
        const broken = `${good.slice(0, 40)} half-typed`;

        writeLiveryConfigText(broken);

        const status = page.locator("[data-component='app-footer']");
        await expect(status).toContainText("CONFIG.JSON UNREADABLE");
        await expect(toggle).toHaveAttribute("aria-checked", before ?? "");
        expect(readLiveryConfigText()).toBe(broken);

        await test.step("a page opened now shows the last good values and the message", async () => {
            await openListening(page, "/settings/adapters/nvim");
            await expect(status).toContainText("CONFIG.JSON UNREADABLE");
            await expect(toggle).toHaveAttribute("aria-checked", before ?? "");
        });

        await test.step("saving is refused with the reason on the panel", async () => {
            await toggle.click();
            await page.getByRole("button", { name: "SAVE SETTINGS" }).click();
            await expect(page.getByText("left as it is", { exact: false })).toBeVisible();
            expect(readLiveryConfigText()).toBe(broken);
        });

        await test.step("repairing the file clears the message", async () => {
            writeLiveryConfigText(good);
            await expect(status).not.toContainText("CONFIG.JSON UNREADABLE");
        });
    });
});

test.describe("the active theme", () => {
    const setActiveTheme = (key: string) => {
        const config = JSON.parse(readLiveryConfigText()) as Config;
        writeLiveryConfigText(JSON.stringify({ ...config, active_theme: key }, null, 4));
    };

    test("set in the file applies to every tool once, and the list follows", async ({ page }) => {
        await openListening(page, "/");
        const applies = countCalls(page, "update_app");

        setActiveTheme(DIMMED_LIGHT);
        const written = readLiveryConfigText();

        const cursor = page.getByRole("option", { selected: true });
        await expect(cursor).toContainText("Dimmed Light");
        await expect(cursor).toContainText("ACTIVE");
        await expect(page.getByRole("option").filter({ hasText: "ACTIVE" })).toHaveCount(1);
        await expect
            .poll(() => readHomeFile("~/.config/zed/settings.json"))
            .toContain(`"theme": "Black Atom — Dimmed Light"`);
        await page.waitForTimeout(SETTLE_MS);
        expect(applies).toHaveLength(ENABLED_ADAPTERS);
        expect(readLiveryConfigText()).toBe(written);
    });

    test("edited and saved over by Livery at once still applies", async ({ page, request }) => {
        await openListening(page, "/");
        const applies = countCalls(page, "update_app");

        setActiveTheme(DIMMED_LIGHT);
        const config = await invokeBridge<Config>(request, "get_config");
        await invokeBridge(request, "save_config", { config });

        await expect(page.getByRole("option", { selected: true })).toContainText("ACTIVE");
        await expect
            .poll(() => readHomeFile("~/.config/zed/settings.json"))
            .toContain(`"theme": "Black Atom — Dimmed Light"`);
        await page.waitForTimeout(SETTLE_MS);
        expect(applies).toHaveLength(ENABLED_ADAPTERS);
    });

    test("a second edit during an apply wins, and the file keeps it", async ({ page }) => {
        await openListening(page, "/");

        const firstApply = page.waitForRequest((r) => r.url().endsWith("/update_app"));
        setActiveTheme(DIMMED_LIGHT);
        await firstApply;
        setActiveTheme(SECOND_THEME.key);
        const written = readLiveryConfigText();

        await expect
            .poll(() => readHomeFile("~/.config/zed/settings.json"))
            .toContain(`"theme": "${SECOND_THEME.zedLabel}"`);
        await page.waitForTimeout(SETTLE_MS);
        expect(readHomeFile("~/.config/zed/settings.json")).toContain(SECOND_THEME.zedLabel);
        expect(readLiveryConfigText()).toBe(written);
    });

    test("picked in Livery applies once", async ({ page }) => {
        await openListening(page, "/");
        const applies = countCalls(page, "update_app");

        const row = await pickTheme(page, "DEFAULT", "Dimmed Light");
        await row.press("Enter");
        await expect(row).toContainText("ACTIVE");

        await page.waitForTimeout(SETTLE_MS);
        expect(applies).toHaveLength(ENABLED_ADAPTERS);
    });

    test("naming no known theme shows an error and applies nothing", async ({ page }) => {
        await openListening(page, "/");
        const zed = readHomeFile("~/.config/zed/settings.json");
        const applies = countCalls(page, "update_app");

        setActiveTheme("black-atom-no-such-theme");

        await expect(page.locator("[data-component='app-footer']")).toContainText(
            "NO THEME NAMED black-atom-no-such-theme",
        );
        await page.waitForTimeout(SETTLE_MS);
        expect(applies).toHaveLength(0);
        expect(readHomeFile("~/.config/zed/settings.json")).toBe(zed);

        await test.step("picking a theme clears the error", async () => {
            const row = await pickTheme(page, "DEFAULT", "Dimmed Light");
            await row.press("Enter");
            await expect(row).toContainText("ACTIVE");
            await expect(page.locator("[data-component='app-footer']")).not.toContainText(
                "NO THEME NAMED",
            );
        });
    });
});
