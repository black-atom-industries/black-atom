import { expect, test } from "../../lib/e2e.ts";

test("AUTO-DETECT finds the adapters whose config files exist", async ({ page }) => {
    await page.goto("/settings/adapters");
    await page.getByRole("button", { name: "AUTO-DETECT" }).click();

    await expect(page.getByText(/^4 OF \d+ FOUND$/)).toBeVisible();
});

test("a found but disabled adapter is flagged in the sidebar", async ({ page }) => {
    await page.goto("/settings/adapters");
    await page.getByRole("button", { name: "AUTO-DETECT" }).click();

    const row = (name: string) => page.getByRole("option").filter({ hasText: name });
    await expect(row("tuicr")).toContainText("FOUND");
    await expect(row("delta")).not.toContainText("FOUND");
    await expect(row("ghostty")).toContainText("DISABLED");
    await expect(row("ghostty")).not.toContainText("FOUND");
});
