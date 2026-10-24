import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.route("**/_vercel/insights/script.js", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
    );
});

async function sceneCanvas(page: Page) {
    const canvas = page.locator('[data-component="BackgroundLayer"] canvas');
    await expect(canvas).toHaveCount(1);
    return canvas;
}

test("moving between black-hole pages keeps the same canvas", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await sceneCanvas(page);
    const first = await page.locator('[data-component="BackgroundLayer"] canvas').elementHandle();

    await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: /Black Atom/ })
        .click();
    await expect(page).toHaveURL(/\/black-atom$/);
    await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "Changelog" })
        .click();
    await expect(page).toHaveURL(/\/changelog$/);
    await expect(page.locator('[data-component="BackgroundLayer"]')).toHaveAttribute(
        "data-state",
        "wide",
    );

    await sceneCanvas(page);
    expect(
        await page.evaluate(
            (canvas) =>
                canvas === document.querySelector('[data-component="BackgroundLayer"] canvas'),
            first,
        ),
    ).toBe(true);
});

test("a product page runs exactly one scene", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await sceneCanvas(page);
    await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: /iter\.nvim/ })
        .click();
    await expect(page).toHaveURL(/\/iter$/);
    await expect(page.locator('[data-component="BackgroundLayer"]')).toHaveAttribute(
        "data-state",
        "iter",
    );
    await expect(page.locator("canvas")).toHaveCount(1);
});

test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    for (const path of ["/", "/iter"]) {
        test(`${path} shows a still frame`, async ({ page }) => {
            await page.goto(path, { waitUntil: "networkidle" });
            await sceneCanvas(page);
            // An animated scene never holds still; a still one does once its first frame is drawn.
            await expect
                .poll(
                    async () => {
                        const before = await page.screenshot();
                        await page.waitForTimeout(800);
                        return (await page.screenshot()).equals(before);
                    },
                    { timeout: 15_000 },
                )
                .toBe(true);
        });
    }

    test("a page change cuts instead of flying", async ({ page }) => {
        await page.goto("/", { waitUntil: "networkidle" });
        await sceneCanvas(page);
        await page
            .getByRole("navigation", { name: "Main" })
            .getByRole("link", { name: /iter\.nvim/ })
            .click();
        await expect(page.locator('[data-component="BackgroundLayer"]')).toHaveAttribute(
            "data-state",
            "iter",
        );
        // A flight moves the camera for about two seconds; a cut holds still within a moment.
        await expect
            .poll(
                async () => {
                    const before = await page.screenshot();
                    await page.waitForTimeout(250);
                    return (await page.screenshot()).equals(before);
                },
                { timeout: 1200, intervals: [0] },
            )
            .toBe(true);
    });
});
