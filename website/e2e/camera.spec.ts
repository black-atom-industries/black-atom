import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.route("**/_vercel/insights/script.js", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
    );
});

function layer(page: Page) {
    return page.locator('[data-component="BackgroundLayer"]');
}

async function ctrlWheel(page: Page, deltaY: number, times: number) {
    await page.mouse.move(700, 400);
    await page.keyboard.down("Control");
    for (let i = 0; i < times; i++) await page.mouse.wheel(0, deltaY);
    await page.keyboard.up("Control");
}

/** The zoom once two reads a moment apart agree, so a capture never lands mid-change. */
async function settledZoom(page: Page) {
    const read = async () => Number(await layer(page).getAttribute("data-zoom"));
    let previous = Number.NaN;
    await expect
        .poll(
            async () => {
                const current = await read();
                const isSettled = current === previous;
                previous = current;
                return isSettled;
            },
            { intervals: [200] },
        )
        .toBe(true);
    return previous;
}

test("Ctrl+wheel zooms the camera within its range, not the page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00", { timeout: 15_000 });
    const zoomOf = async () => Number(await layer(page).getAttribute("data-zoom"));

    await ctrlWheel(page, 60, 1);
    await expect.poll(zoomOf).toBeGreaterThan(1);

    await ctrlWheel(page, 60, 40);
    const farthest = await settledZoom(page);
    expect(farthest).toBeGreaterThan(1);
    await ctrlWheel(page, 60, 5);
    await expect.poll(zoomOf).toBe(farthest);

    await ctrlWheel(page, -60, 60);
    const closest = await settledZoom(page);
    expect(closest).toBeLessThan(1);
    await ctrlWheel(page, -60, 5);
    await expect.poll(zoomOf).toBe(closest);

    expect(await page.evaluate(() => [visualViewport?.scale, devicePixelRatio])).toEqual([1, 1]);

    await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: /iter\.nvim/ })
        .click();
    await expect(layer(page)).toHaveAttribute("data-state", "iter");
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00");
});

test("the wide shot zooms in but no farther out", async ({ page }) => {
    await page.goto("/changelog", { waitUntil: "networkidle" });
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00", { timeout: 15_000 });

    await ctrlWheel(page, 60, 10);
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00");
    await ctrlWheel(page, -60, 2);
    await expect
        .poll(async () => Number(await layer(page).getAttribute("data-zoom")))
        .toBeLessThan(1);
});

test("a page change on the same shot resets the zoom", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main" });
    const zoomOf = async () => Number(await layer(page).getAttribute("data-zoom"));
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00", { timeout: 15_000 });

    await ctrlWheel(page, -60, 2);
    await expect.poll(zoomOf).toBeLessThan(1);
    await nav.getByRole("link", { name: /Black Atom/ }).click();
    await expect(page).toHaveURL(/\/black-atom$/);
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00");

    await nav.getByRole("link", { name: "Changelog" }).click();
    await expect(layer(page)).toHaveAttribute("data-state", "wide");
    await ctrlWheel(page, -60, 2);
    await expect.poll(zoomOf).toBeLessThan(1);
    await nav.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00");
});

test("a plain wheel still scrolls the page", async ({ page }) => {
    await page.goto("/black-atom", { waitUntil: "networkidle" });
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00", { timeout: 15_000 });
    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00");
});

test("Ctrl+wheel still zooms with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(layer(page)).toHaveAttribute("data-zoom", "1.00", { timeout: 15_000 });
    await ctrlWheel(page, -60, 2);
    await expect
        .poll(async () => Number(await layer(page).getAttribute("data-zoom")))
        .toBeLessThan(1);
});
