import { themeCatalog } from "@black-atom/core";
import { expect, test, type Page } from "@playwright/test";

const routes = [
    { path: "/", h1: "Black AtomIndustries", title: "Black Atom Industries" },
    { path: "/black-atom", h1: "Black Atom", title: "Black Atom · Black Atom Industries" },
    { path: "/black-atom/livery", h1: "Livery", title: /^Livery · / },
    { path: "/black-atom/themes/jpn-koyo-dark", h1: "Koyo Dark", title: /^JPN Koyo Dark · / },
    { path: "/iter", h1: "iter.nvim", title: /^iter\.nvim · / },
    { path: "/radar", h1: "radar.nvim", title: /^radar\.nvim · / },
    { path: "/changelog", h1: "Changelog", title: /^Changelog · / },
    { path: "/about", h1: "About", title: /^About · / },
    { path: "/impressum", h1: "Impressum", title: /^Impressum · / },
    { path: "/privacy", h1: "Privacy", title: /^Privacy · / },
];

const fontServices = /fonts\.(googleapis|gstatic)\.com/;

test.beforeEach(async ({ page }) => {
    // Vercel serves the analytics script only on its own platform.
    await page.route("**/_vercel/insights/script.js", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
    );
});

for (const route of routes) {
    test(`${route.path} renders its page with a clean console`, async ({ page }) => {
        const problems: string[] = [];
        const requests: string[] = [];
        page.on("console", (message) => {
            if (message.type() === "error" || message.type() === "warning") {
                problems.push(message.text());
            }
        });
        page.on("pageerror", (error) => problems.push(error.message));
        page.on("request", (request) => requests.push(request.url()));

        const response = await page.goto(route.path, { waitUntil: "networkidle" });

        expect(response?.status()).toBe(200);
        expect(await response?.text()).not.toMatch(fontServices);
        await expect(page.locator("h1")).toHaveText(route.h1);
        await expect(page).toHaveTitle(route.title);
        await expect(page.locator("html")).toHaveAttribute("data-theme", "black-atom-default-dark");
        expect(requests.filter((url) => fontServices.test(url))).toEqual([]);
        expect(problems).toEqual([]);
    });
}

function watchConsole(page: Page): string[] {
    const problems: string[] = [];
    page.on("console", (message) => {
        // A 404 document logs its own status as a failed resource; that is the expected answer.
        const isDocumentStatus =
            message.text().startsWith("Failed to load resource") &&
            message.location().url === page.url();
        if ((message.type() === "error" || message.type() === "warning") && !isDocumentStatus) {
            problems.push(message.text());
        }
    });
    page.on("pageerror", (error) => problems.push(error.message));
    return problems;
}

for (const path of ["/black-atom/themes/no-such-theme", "/no-such-page"]) {
    test(`${path} answers 404 with the site around it`, async ({ page }) => {
        const problems = watchConsole(page);
        const response = await page.goto(path, { waitUntil: "networkidle" });

        expect(response?.status()).toBe(404);
        await expect(page.locator("h1")).toHaveText("Not found");
        await expect(page).toHaveTitle("Black Atom Industries");
        await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
        expect(problems).toEqual([]);
    });
}

test("the root layout loads Vercel Web Analytics", async ({ page }) => {
    const analytics = page.waitForRequest("**/_vercel/insights/script.js");
    await page.goto("/");

    await analytics;
});

test("the footer marks only the current page", async ({ page }) => {
    await page.goto("/black-atom/livery", { waitUntil: "networkidle" });

    await expect(page.locator('footer a[aria-current="page"]')).toHaveText(["Livery"]);
});

test("a theme page previews the theme it documents", async ({ page }) => {
    await page.goto("/black-atom/themes/jpn-koyo-light", { waitUntil: "networkidle" });

    const scopeBackground = await page
        .locator('[data-component="ThemeScope"]')
        .evaluate((element) => getComputedStyle(element).backgroundColor);
    const pageBackground = await page
        .locator("body")
        .evaluate((element) => getComputedStyle(element).backgroundColor);
    const koyoLightBackground = await page.evaluate((color) => {
        const probe = document.createElement("div");
        probe.style.background = color;
        document.body.append(probe);
        const computed = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return computed;
    }, themeCatalog["black-atom-jpn-koyo-light"].ui.bg.default);

    expect(scopeBackground).not.toBe(pageBackground);
    expect(scopeBackground).toBe(koyoLightBackground);
});

test("a theme page applies its theme site-wide", async ({ page }) => {
    await page.goto("/black-atom/themes/jpn-koyo-light", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Use site-wide" }).click();

    await expect(page).toHaveURL(/\?theme=jpn-koyo-light$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "black-atom-jpn-koyo-light");
    await expect(page.getByRole("button", { name: "Wearing site-wide" })).toBeVisible();
});
