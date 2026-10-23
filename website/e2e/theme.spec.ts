import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    // Vercel serves the analytics script only on its own platform.
    await page.route("**/_vercel/insights/script.js", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
    );
});

function watchConsole(page: Page): string[] {
    const problems: string[] = [];
    page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
            problems.push(message.text());
        }
    });
    page.on("pageerror", (error) => problems.push(error.message));
    return problems;
}

async function pickTheme(page: Page, name: string) {
    await page.getByRole("button", { name: "Theme", exact: true }).click();
    // The Default collection comes first, and other collections reuse names such as "Dark".
    await page.getByRole("button", { name, exact: true }).first().click();
}

function navLink(page: Page, name: string) {
    return page.getByRole("navigation", { name: "Main" }).getByRole("link", { name });
}

test("a picked theme is stored and survives a reload without the param", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/about", { waitUntil: "networkidle" });

    await pickTheme(page, "Koyo Dark");
    await expect(page).toHaveURL(/\/about\?theme=jpn-koyo-dark$/);

    await page.goto("/about", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "black-atom-jpn-koyo-dark");
    expect(problems).toEqual([]);
});

test("picking the default dark theme drops the param", async ({ page }) => {
    await page.goto("/about?theme=jpn-koyo-dark", { waitUntil: "networkidle" });

    await pickTheme(page, "Dark");

    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "black-atom-default-dark");
});

test("the theme param stays on the URL across navigation", async ({ page }) => {
    await page.goto("/about?theme=jpn-koyo-dark", { waitUntil: "networkidle" });

    await navLink(page, "Changelog").click();

    await expect(page).toHaveURL(/\/changelog\?theme=jpn-koyo-dark$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "black-atom-jpn-koyo-dark");
});

test("an unknown theme param is dropped on navigation", async ({ page }) => {
    await page.goto("/about?theme=bogus", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "black-atom-default-dark");

    await navLink(page, "Changelog").click();

    await expect(page).toHaveURL(/\/changelog$/);
});
