import { expect, test } from "@playwright/test";

test.use({ launchOptions: { args: ["--disable-3d-apis"] } });

test.beforeEach(async ({ page }) => {
    await page.route("**/_vercel/insights/script.js", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
    );
    // No WebGPU adapter; the launch flag below turns WebGL off.
    await page.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, "gpu", { get: () => undefined });
    });
});

const shots = [
    { path: "/", view: "hole" },
    { path: "/iter", view: "iter" },
    { path: "/radar", view: "radar" },
    { path: "/changelog", view: "wide" },
];

for (const { path, view } of shots) {
    test(`${path} shows the ${view} outline without 3D`, async ({ page }) => {
        const problems: string[] = [];
        page.on("console", (message) => {
            const text = message.text();
            const isExpected = text.startsWith("[background] scene unavailable");
            if ((message.type() === "error" || message.type() === "warning") && !isExpected) {
                problems.push(text);
            }
        });
        page.on("pageerror", (error) => problems.push(error.message));

        await page.goto(path, { waitUntil: "networkidle" });
        const layer = page.locator('[data-component="BackgroundLayer"]');
        await expect(layer.locator('[data-component="BackgroundFallback"] svg')).toBeVisible();
        await expect(layer).toHaveAttribute("data-state", view);
        await expect(layer.locator("canvas")).toHaveCount(0);
        expect(problems).toEqual([]);
    });
}

test("the fallback follows client navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const fallback = page.locator('[data-component="BackgroundFallback"]');
    await expect(fallback).toHaveCount(1);
    await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: /radar\.nvim/ })
        .click();
    await expect(page.locator('[data-component="BackgroundLayer"]')).toHaveAttribute(
        "data-state",
        "radar",
    );
    await expect(fallback).toHaveCount(1);
});
