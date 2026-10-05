import type { Page } from "@playwright/test";
import { expect, pickTheme, test } from "../../lib/e2e.ts";

const detail = (page: Page) => page.locator("[data-component='theme-detail']");

test("shows the theme under the cursor", async ({ page }) => {
    await page.goto("/");
    await pickTheme(page, "DEFAULT", "Dimmed Light");

    await expect(detail(page).getByRole("heading")).toHaveText("DIMMED LIGHT");
    await expect(detail(page)).toContainText("KEY black-atom-default-dimmed-light");
    await expect(detail(page)).toContainText("INACTIVE");
});

test("marks the active theme", async ({ page }) => {
    await page.goto("/");

    await expect(detail(page).getByRole("heading")).toHaveText("DIMMED DARK");
    await expect(detail(page)).not.toContainText("INACTIVE");
    await expect(detail(page)).toContainText("ACTIVE");
});

test("matches the theme detail baseline", async ({ page }) => {
    await page.goto("/");
    await pickTheme(page, "DEFAULT", "Dimmed Light");
    await expect(detail(page).getByRole("heading")).toHaveText("DIMMED LIGHT");

    await expect(page).toHaveScreenshot("default-dimmed-light-detail.png");
});
