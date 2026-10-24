import { expect, test, type Page } from "@playwright/test";

declare global {
    interface Window {
        audioContexts?: AudioContext[];
        reverbCount?: number;
    }
}

test.beforeEach(async ({ page }) => {
    await page.route("**/_vercel/insights/script.js", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
    );
    // Records every audio context the page creates; the engine's own is the first.
    await page.addInitScript(() => {
        const Native = window.AudioContext;
        window.audioContexts = [];
        window.reverbCount = 0;
        window.AudioContext = class extends Native {
            constructor(options?: AudioContextOptions) {
                super(options);
                window.audioContexts?.push(this);
            }

            // Each engine boot builds exactly one reverb, so this counts boots.
            override createConvolver() {
                window.reverbCount = (window.reverbCount ?? 0) + 1;
                return super.createConvolver();
            }
        };
    });
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

function engineState(page: Page) {
    return page.evaluate(() => window.audioContexts?.[0]?.state ?? "none");
}

/** Holds back the script that carries Tone, found by its content rather than its chunk name. */
async function delayTone(page: Page) {
    await page.route("**/*.js", async (route) => {
        const response = await route.fetch();
        const body = await response.text();
        if (body.includes("OfflineAudioContext")) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        await route.fulfill({ response, body });
    });
}

async function openSoundPanel(page: Page) {
    await page.getByRole("button", { name: "Sound", exact: true }).click();
    return page.getByRole("dialog", { name: "Sound" });
}

test("switching sound on runs the audio, and it keeps playing through /iter and /radar", async ({
    page,
}) => {
    const problems = watchConsole(page);
    await page.goto("/", { waitUntil: "networkidle" });
    expect(await engineState(page)).toBe("none");

    const panel = await openSoundPanel(page);
    const toggle = panel.getByRole("button", { name: "Soundscape on / off" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => engineState(page)).toBe("running");

    await page.keyboard.press("Escape");
    const main = page.getByRole("navigation", { name: "Main" });
    await main.getByRole("link", { name: /iter\.nvim/ }).click();
    await expect(page).toHaveURL(/\/iter$/);
    await main.getByRole("link", { name: /radar\.nvim/ }).click();
    await expect(page).toHaveURL(/\/radar$/);
    // The engine stays running across the page changes, not only at one moment after them.
    const states = await page.evaluate(async () => {
        const seen: string[] = [];
        for (let i = 0; i < 10; i++) {
            seen.push(window.audioContexts?.[0]?.state ?? "none");
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return seen;
    });
    expect(new Set(states)).toEqual(new Set(["running"]));
    expect(problems).toEqual([]);
});

for (const path of ["/about", "/iter", "/radar", "/changelog", "/impressum", "/does-not-exist"]) {
    test(`${path} has the sound panel`, async ({ page }) => {
        await page.goto(path, { waitUntil: "networkidle" });
        await expect(await openSoundPanel(page)).toBeVisible();
    });
}

test("sound switches on from the panel on /iter", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/iter", { waitUntil: "networkidle" });
    const panel = await openSoundPanel(page);
    await panel.getByRole("button", { name: "Soundscape on / off" }).click();
    await expect.poll(() => engineState(page)).toBe("running");
    expect(problems).toEqual([]);
});

test("a remembered 'on' waits for the first click, then starts", async ({ page }) => {
    const problems = watchConsole(page);
    await page.addInitScript(() => {
        localStorage.setItem("ba-sound", JSON.stringify({ isOn: true, volume: 50 }));
    });
    await page.goto("/", { waitUntil: "networkidle" });
    expect(await engineState(page)).toBe("none");

    const panel = await openSoundPanel(page);
    await expect(panel.getByRole("button", { name: "Soundscape on / off" })).toHaveAttribute(
        "aria-pressed",
        "true",
    );
    await expect.poll(() => engineState(page)).toBe("running");
    await expect(panel.getByRole("status")).toHaveCount(0);
    expect(problems).toEqual([]);
});

test("switching off while the sound still loads leaves the audio suspended", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await delayTone(page);

    const panel = await openSoundPanel(page);
    const toggle = panel.getByRole("button", { name: "Soundscape on / off" });
    await toggle.click();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => engineState(page), { timeout: 10_000 }).toBe("suspended");
    expect(problems).toEqual([]);
});

test("switching on and moving between pages while the sound loads boots once", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await delayTone(page);
    const main = page.getByRole("navigation", { name: "Main" });

    const panel = await openSoundPanel(page);
    await panel.getByRole("button", { name: "Soundscape on / off" }).click();
    await page.keyboard.press("Escape");
    await main.getByRole("link", { name: /iter\.nvim/ }).click();
    await expect(page).toHaveURL(/\/iter$/);
    await main.getByRole("link", { name: /Black Atom/ }).click();
    await expect(page).toHaveURL(/\/black-atom$/);

    const reverbs = () => page.evaluate(() => window.reverbCount);
    await expect.poll(reverbs, { timeout: 10_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1000);
    expect(await reverbs()).toBe(1);
    expect(await engineState(page)).toBe("running");
    expect(problems).toEqual([]);
});
