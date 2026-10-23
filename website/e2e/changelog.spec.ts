import { expect, test, type Page } from "@playwright/test";

// GitHub answers from e2e/github-stub.ts: fixture releases and commits, and a rate limit for livery/.

test.beforeEach(async ({ page }) => {
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

const releases = (page: Page) => page.locator('[data-component="ReleaseList"] article');
const commits = (page: Page) => page.locator('[data-component="CommitList"] li');

test("/changelog?product=radar shows only radar.nvim", async ({ page }) => {
    await page.goto("/changelog?product=radar");

    await expect(releases(page)).toHaveCount(1);
    await expect(releases(page)).toContainText("v0.8.0");
    await expect(releases(page)).toContainText("Locks sit on the home row");
    await expect(commits(page)).toHaveText([
        /^50f48f4\s*feat\(keys\): put lock slots on the home row and recent files on numbers\s*10-18$/,
        /^35ac047\s*fix\(locks\): warn when all lock slots are in use\s*10-17$/,
    ]);
});

test("/changelog lists every product's releases, labelled by product", async ({ page }) => {
    await page.goto("/changelog");

    for (const product of ["Black Atom", "Livery", "iter.nvim", "radar.nvim"]) {
        await expect(releases(page).filter({ hasText: product }).first()).toBeVisible();
    }
    await expect(page.getByText("nightly")).toHaveCount(0);
});

test("a shared release splits its highlights by product subheading", async ({ page }) => {
    await page.goto("/black-atom");
    await expect(releases(page).first()).toContainText("Terra gets a winter night");
    await expect(releases(page).first()).not.toContainText("Livery remembers");

    await page.goto("/black-atom/livery");
    await expect(releases(page).first()).toContainText("Livery remembers");
    await expect(releases(page).first()).not.toContainText("Terra gets a winter night");
});

test("a rate-limited feed shows the fallback with a GitHub link and a clean console", async ({
    page,
}) => {
    const problems = watchConsole(page);

    await page.goto("/black-atom/livery", { waitUntil: "networkidle" });

    const commitList = page.locator('[data-component="CommitList"]');
    await expect(commitList).toContainText("Nothing to show here yet.");
    await expect(commitList.getByRole("link", { name: "GitHub" })).toHaveAttribute(
        "href",
        "https://github.com/black-atom-industries/black-atom",
    );
    await expect(releases(page).first()).toBeVisible();
    expect(problems).toEqual([]);
});

test("the product hero shows the latest release from GitHub", async ({ page }) => {
    await page.goto("/iter");
    await expect(page.locator('[data-partial="ProductHero"]')).toContainText("v0.4.0");
});

test("server function responses carry the CDN cache header", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/about", { waitUntil: "networkidle" });

    const serverFnResponse = page.waitForResponse((response) =>
        response.url().includes("/_serverFn/"),
    );
    await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "radar.nvim" })
        .click();
    const response = await serverFnResponse;

    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toBe("s-maxage=60, stale-while-revalidate=600");
    await expect(page.locator("h1")).toHaveText("radar.nvim");
    await expect(releases(page)).toContainText("Locks sit on the home row");
    expect(problems).toEqual([]);
});

test("pages cache at the CDN only as long as their GitHub feeds allow", async ({ page }) => {
    const radar = await page.goto("/radar");
    expect(radar?.headers()["cache-control"]).toBe("s-maxage=60, stale-while-revalidate=600");

    const livery = await page.goto("/black-atom/livery");
    expect(livery?.headers()["cache-control"]).toBe("s-maxage=60");

    const about = await page.goto("/about");
    expect(about?.headers()["cache-control"]).toBeUndefined();
});
