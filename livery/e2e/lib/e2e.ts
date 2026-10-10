import { type Locator, type Page, test as base } from "@playwright/test";
import { expectBridgeInFixtureHome, invokeBridge } from "./bridge.ts";
import { resetFixtureHome, type Scenario } from "./fixture-home.ts";

export { expect } from "@playwright/test";

/**
 * Every test starts from a fresh copy of its scenario's fixture home.
 * Override per file with `test.use({ scenario: "fresh" })`.
 */
export const test = base.extend<{ scenario: Scenario; fixtureHome: void }>({
    scenario: ["existing-installation", { option: true }],
    fixtureHome: [
        async ({ request, scenario }, use) => {
            await expectBridgeInFixtureHome(request);
            resetFixtureHome(scenario);
            // The app unpacks its themes at launch. Doing it here keeps later
            // unpack checks read-only, so no test leaves a write in flight.
            await invokeBridge(request, "get_app_status");
            await use();
        },
        { auto: true },
    ],
});

/** The app version in the header, which changes with every release. */
export function appVersion(page: Page): Locator {
    return page.getByText(/^V\d+\.\d+\.\d+/);
}

/** A theme row, matched on its exact name. */
export function themeRow(page: Page, name: string): Locator {
    return page.getByRole("option").filter({ has: page.getByText(name, { exact: true }) });
}

/** Narrow the list to one collection through its chip, then click a theme. */
export async function pickTheme(page: Page, collection: string, name: string): Promise<Locator> {
    await page.getByRole("button", { name: collection, exact: true }).click();
    const row = themeRow(page, name);
    await row.click();
    return row;
}

/** A settings text field, located by its uppercase label. */
export function settingsField(page: Page, label: string): Locator {
    return page
        .locator("[data-component='text-input']")
        .filter({ hasText: label })
        .locator("input");
}
