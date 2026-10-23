import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BackgroundRenderer, SceneTheme } from "./types.ts";

interface Stub extends BackgroundRenderer {
    kind: string;
    log: string[];
    finishStart(): void;
    failStart(): void;
}

const created: Stub[] = [];

function createStub(kind: string): Stub {
    const log: string[] = [];
    let settle: { resolve(): void; reject(error: Error): void } | undefined;
    const stub: Stub = {
        kind,
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
        setState: (state) => log.push(`state:${state}`),
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

vi.mock("./black-hole/black-hole.ts", () => ({ createBlackHole: () => createStub("black-hole") }));
vi.mock("./iter/iter.ts", () => ({ createIterScene: () => createStub("iter") }));
vi.mock("./radar/radar.ts", () => ({ createRadarScene: () => createStub("radar") }));

const { createBackgroundController } = await import("./controller.ts");

const theme: SceneTheme = { vars: {} as SceneTheme["vars"], appearance: "dark" };
const host = {} as HTMLElement;

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
    it("eases between black-hole states on one renderer instead of remounting", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: "full", theme, isStill: false });
        await settled();
        controller.update({ state: "receded", theme, isStill: false });
        controller.update({ state: "full", theme, isStill: false });

        expect(created.map((stub) => stub.kind)).toEqual(["black-hole"]);
        expect(created[0]?.log).toEqual([
            "state:full",
            "theme",
            "start",
            "state:receded",
            "state:full",
        ]);
    });

    it("disposes the black hole before a product scene takes over", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: "full", theme, isStill: false });
        await settled();
        created[0]?.finishStart();
        controller.update({ state: "iter", theme, isStill: false });
        await settled();

        expect(created.map((stub) => stub.kind)).toEqual(["black-hole", "iter"]);
        expect(created[0]?.log.at(-1)).toBe("dispose");
        expect(created[1]?.log).toContain("start");
        expect(created[1]?.log).not.toContain("dispose");
    });

    it("drops a mount that a newer route overtook while its module loaded", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: "iter", theme, isStill: false });
        controller.update({ state: "radar", theme, isStill: false });
        await settled();

        const iter = created.find((stub) => stub.kind === "iter");
        const radar = created.find((stub) => stub.kind === "radar");
        expect(iter?.log ?? []).not.toContain("start");
        expect(radar?.log).toContain("start");
    });

    it("disposes a renderer that is still starting", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: "full", theme, isStill: false });
        await settled();
        controller.dispose();

        expect(created[0]?.log).toEqual(["state:full", "theme", "start", "dispose"]);
    });

    it("stays on the theme background for the session after a scene fails to start", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: "full", theme, isStill: false });
        await settled();
        created[0]?.failStart();
        await settled();
        controller.update({ state: "receded", theme, isStill: false });
        controller.update({ state: "full", theme, isStill: false });
        await settled();

        expect(created.map((stub) => stub.kind)).toEqual(["black-hole"]);
        expect(created[0]?.log.at(-1)).toBe("dispose");
        expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("passes notes and kicks to the running renderer", async () => {
        const controller = createBackgroundController(host);
        controller.update({ state: "full", theme, isStill: false });
        await settled();
        controller.sing({ pitch: 60, delay: 0, duration: 1, amp: 1 });
        controller.pulse(1);

        expect(created[0]?.log.slice(-2)).toEqual(["sing", "pulse"]);
    });
});
