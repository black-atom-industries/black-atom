import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backgroundStateFor, backgroundStateKey } from "#/lib/route-background-state.ts";
import type { BackgroundRenderer, SceneTheme } from "./types.ts";

interface Stub extends BackgroundRenderer {
    log: string[];
    finishStart(): void;
    failStart(): void;
}

const created: Stub[] = [];

function createStub(): Stub {
    const log: string[] = [];
    let settle: { resolve(): void; reject(error: Error): void } | undefined;
    const stub: Stub = {
        log,
        events: { on: () => () => {} },
        start: () => {
            log.push("start");
            return new Promise<void>((resolve, reject) => {
                settle = { resolve, reject };
            });
        },
        finishStart: () => settle?.resolve(),
        failStart: () => settle?.reject(new Error("no GPU")),
        setState: (state) => log.push(`state:${backgroundStateKey(state)}`),
        setTheme: () => log.push("theme"),
        sing: () => log.push("sing"),
        pulse: () => log.push("pulse"),
        pause: () => log.push("pause"),
        resume: () => log.push("resume"),
        dispose: () => log.push("dispose"),
    };
    created.push(stub);
    return stub;
}

vi.mock("./space/space.ts", () => ({ createSpace: () => createStub() }));

const { createBackgroundController } = await import("./controller.ts");

const theme: SceneTheme = { vars: {} as SceneTheme["vars"], appearance: "dark" };
const host = {} as HTMLElement;
const full = backgroundStateFor("/");
const receded = backgroundStateFor("/black-atom/themes/jpn-koyo-dark");
const iter = backgroundStateFor("/iter");
const radar = backgroundStateFor("/radar");

async function settled() {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
    created.length = 0;
    vi.stubGlobal("document", {
        hidden: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("createBackgroundController", () => {
    it("keeps one space renderer across every state instead of remounting", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: full, theme, isStill: false });
        await settled();
        controller.update({ state: receded, theme, isStill: false });
        controller.update({ state: iter, theme, isStill: false });
        controller.update({ state: radar, theme, isStill: false });
        controller.update({ state: full, theme, isStill: false });

        expect(created).toHaveLength(1);
        expect(created[0]?.log).toEqual([
            "state:hole",
            "theme",
            "start",
            "state:hole-receded",
            "state:iter",
            "state:radar",
            "state:hole",
        ]);
    });

    it("disposes the renderer before a still one takes over", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: full, theme, isStill: false });
        await settled();
        created[0]?.finishStart();
        controller.update({ state: full, theme, isStill: true });
        await settled();

        expect(created).toHaveLength(2);
        expect(created[0]?.log.at(-1)).toBe("dispose");
        expect(created[1]?.log).toContain("start");
        expect(created[1]?.log).not.toContain("dispose");
    });

    it("drops a mount that a newer one overtook while its module loaded", async () => {
        const loads: ((renderer: Stub) => void)[] = [];
        const controller = createBackgroundController(
            host,
            () => new Promise<BackgroundRenderer>((resolve) => loads.push(resolve)),
        );
        controller.update({ state: full, theme, isStill: false });
        controller.update({ state: full, theme, isStill: true });
        const [first, second] = [createStub(), createStub()];
        loads[1]?.(second);
        loads[0]?.(first);
        await settled();

        expect(first.log).not.toContain("start");
        expect(second.log).toContain("start");
    });

    it("disposes a renderer that is still starting", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: full, theme, isStill: false });
        await settled();
        controller.dispose();

        expect(created[0]?.log).toEqual(["state:hole", "theme", "start", "dispose"]);
    });

    it("stays on the theme background for the session after a scene fails to start", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: full, theme, isStill: false });
        await settled();
        created[0]?.failStart();
        await settled();
        controller.update({ state: receded, theme, isStill: false });
        controller.update({ state: full, theme, isStill: false });
        await settled();

        expect(created).toHaveLength(1);
        expect(created[0]?.log.at(-1)).toBe("dispose");
        expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("passes notes and kicks to the running renderer", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: full, theme, isStill: false });
        await settled();
        controller.sing({ pitch: 60, delay: 0, duration: 1, amp: 1 });
        controller.pulse(1);

        expect(created[0]?.log.slice(-2)).toEqual(["sing", "pulse"]);
    });
});
