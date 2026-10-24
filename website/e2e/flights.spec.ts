import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.route("**/_vercel/insights/script.js", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
    );
});

function mainNav(page: Page) {
    return page.getByRole("navigation", { name: "Main" });
}

async function expectShot(page: Page, path: RegExp, shot: string) {
    await expect(page).toHaveURL(path);
    await expect(page.locator('[data-component="BackgroundLayer"]')).toHaveAttribute(
        "data-state",
        shot,
    );
    await expect(page.locator("canvas")).toHaveCount(1);
}

test("flying between every shot keeps one canvas and a clean console", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/", { waitUntil: "networkidle" });
    await expectShot(page, /\/$/, "hole");
    const canvas = await page.locator("canvas").elementHandle();

    await mainNav(page)
        .getByRole("link", { name: /iter\.nvim/ })
        .click();
    await expectShot(page, /\/iter$/, "iter");

    await mainNav(page).getByRole("link", { name: "Changelog" }).click();
    await expectShot(page, /\/changelog$/, "wide");
    await page
        .getByRole("navigation", { name: "Filter by product" })
        .getByRole("link", { name: "radar.nvim" })
        .click();
    await expectShot(page, /\/changelog\?product=radar$/, "wide-radar");

    await mainNav(page)
        .getByRole("link", { name: /radar\.nvim/ })
        .click();
    await expectShot(page, /\/radar$/, "radar");

    await mainNav(page).getByRole("link", { name: "About" }).click();
    await expectShot(page, /\/about$/, "wide");

    await page
        .getByRole("link", { name: /Black Atom.*Industries/i })
        .first()
        .click();
    await expectShot(page, /\/$/, "hole");

    expect(await page.evaluate((first) => first === document.querySelector("canvas"), canvas)).toBe(
        true,
    );
    expect(errors).toEqual([]);
});
