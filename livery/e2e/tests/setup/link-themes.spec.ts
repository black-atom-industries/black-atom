import { readdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import type { APIRequestContext } from "@playwright/test";
import type { AppName, AppStatus } from "../../../src/bindings.ts";
import { invokeBridge } from "../../lib/bridge.ts";
import { fixture } from "../../lib/environment.ts";
import { homePath, readLiveryConfig } from "../../lib/fixture-home.ts";
import { expect, test } from "../../lib/e2e.ts";

function managedLinks(dir: string, adapter: AppName): string[] {
    const managedDir = realpathSync(join(fixture.dataHome, "black-atom/themes", adapter));
    return readdirSync(dir)
        .map((name) => realpathSync(join(dir, name)))
        .filter((target) => target.startsWith(managedDir));
}

async function isLinked(request: APIRequestContext, adapter: AppName): Promise<boolean> {
    const statuses = await invokeBridge<AppStatus[]>(request, "get_app_status");
    return statuses.some((status) => status.app === adapter && status.linked);
}

test("LINK THEMES symlinks the managed theme files", async ({ page, request }) => {
    expect(await isLinked(request, "zed")).toBe(false);

    await page.goto("/settings/adapters/zed");
    await page.getByRole("button", { name: "LINK THEMES" }).click();

    await expect(page.getByText(/^\d+ linked/)).toBeVisible();
    expect(managedLinks(homePath("~/.config/zed/themes"), "zed").length).toBeGreaterThan(0);
    expect(await isLinked(request, "zed")).toBe(true);
});

test("SET UP enables, links and verifies a linked adapter", async ({ page, request }) => {
    await page.goto("/settings/adapters/tuicr");
    await page.getByRole("button", { name: "SET UP" }).click();

    await expect(page.getByText(/^ENABLE · LINKED \d+ · VERIFY$/)).toBeVisible();
    await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(readLiveryConfig().apps.tuicr.enabled).toBe(true);
    expect(managedLinks(homePath("~/.config/tuicr/themes"), "tuicr").length).toBeGreaterThan(0);
    expect(await isLinked(request, "tuicr")).toBe(true);
});

test("SET UP on a merged adapter only enables and verifies", async ({ page }) => {
    await page.goto("/settings/adapters/lazygit");
    await page.getByRole("button", { name: "SET UP" }).click();

    await expect(page.getByText(/^ENABLE · VERIFY$/)).toBeVisible();
    await expect(page.getByRole("button", { name: "LINK THEMES" })).toHaveCount(0);
});
