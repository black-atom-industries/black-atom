import { describe, expect, it } from "vitest";
import { backgroundStateKey } from "#/lib/route-background-state.ts";
import type { BackgroundState } from "#/background/types.ts";
import { createSpaceRenderer, type SpaceScene } from "./renderer.ts";

function createStubScene(log: string[]): SpaceScene {
    return {
        setState: (state) => log.push(`state:${backgroundStateKey(state)}`),
        setTheme: () => log.push("theme"),
        sing: () => log.push("sing"),
        pulse: () => log.push("pulse"),
        run: () => log.push("run"),
        pause: () => log.push("pause"),
        dispose: () => log.push("dispose"),
    };
}

const host = {} as HTMLElement;
const hole: BackgroundState = { view: "hole", mode: "full" };
const iter: BackgroundState = { view: "iter", mode: "full" };

describe("createSpaceRenderer", () => {
    it("builds the scene for the state set before start", async () => {
        const log: string[] = [];
        let builtFor: BackgroundState | undefined;
        const renderer = createSpaceRenderer(async (_host, _isStill, _emit, state) => {
            builtFor = state;
            return createStubScene(log);
        });
        renderer.setState(iter);
        await renderer.start(host, { isStill: false, onFail: () => {} });

        expect(builtFor).toBe(iter);
        expect(log).toEqual(["run"]);
    });

    it("applies a state set while the scene starts", async () => {
        const log: string[] = [];
        let finish: (() => void) | undefined;
        const renderer = createSpaceRenderer(async () => {
            await new Promise<void>((resolve) => {
                finish = resolve;
            });
            return createStubScene(log);
        });
        renderer.setState(hole);
        const started = renderer.start(host, { isStill: false, onFail: () => {} });
        renderer.setState(iter);
        finish?.();
        await started;

        expect(log).toEqual(["state:iter", "run"]);
    });

    it("hands the scene the way to report that it stopped", async () => {
        const reported: unknown[] = [];
        const renderer = createSpaceRenderer(async (_host, _isStill, _emit, _state, fail) => {
            fail(new Error("device lost"));
            return createStubScene([]);
        });
        await renderer.start(host, { isStill: false, onFail: (error) => reported.push(error) });

        expect(reported).toHaveLength(1);
    });

    it("disposes a scene that finishes starting after dispose", async () => {
        const log: string[] = [];
        const renderer = createSpaceRenderer(async () => createStubScene(log));
        const started = renderer.start(host, { isStill: false, onFail: () => {} });
        renderer.dispose();
        await started;

        expect(log).toEqual(["dispose"]);
    });
});
