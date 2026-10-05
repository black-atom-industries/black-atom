import { expect, test } from "../../lib/e2e.ts";

test.use({ scenario: "fresh" });

test("without enabled adapters, the main view points to settings", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("PICK A LIVERY, PAINT THE COCKPIT")).toBeVisible();
    await page.getByRole("button", { name: /CHECK ADAPTERS/ }).click();
    await expect(page).toHaveURL(/\/settings\/adapters$/);
});

test("matches the empty state baseline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("PICK A LIVERY, PAINT THE COCKPIT")).toBeVisible();

    await expect(page).toHaveScreenshot("empty-state.png");
});
