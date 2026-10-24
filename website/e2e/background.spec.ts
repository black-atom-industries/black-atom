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

/** Waits two animation frames, so effects from the last render have run. */
async function nextFrames(page: Page) {
    await page.evaluate(
        () =>
            new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined))),
            ),
    );
}

test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    for (const path of ["/", "/iter"]) {
        test(`${path} shows a still frame`, async ({ page }) => {
            await page.goto(path, { waitUntil: "networkidle" });
            await sceneCanvas(page);
            // A still scene marks its layer once its frame is drawn and it stops rendering.
            await expect(page.locator('[data-component="BackgroundLayer"]')).toHaveAttribute(
                "data-frame",
                "still",
                { timeout: 15_000 },
            );
        });
    }

    test("a page change cuts instead of flying", async ({ page }) => {
        const layer = page.locator('[data-component="BackgroundLayer"]');
        await page.goto("/", { waitUntil: "networkidle" });
        await expect(layer).toHaveAttribute("data-frame", "still", { timeout: 15_000 });
        await page
            .getByRole("navigation", { name: "Main" })
            .getByRole("link", { name: /iter\.nvim/ })
            .click();
        await expect(layer).toHaveAttribute("data-state", "iter");
        await nextFrames(page);
        await expect(layer).not.toHaveAttribute("data-flights");
        await expect(layer).toHaveAttribute("data-frame", "still");
    });
});
