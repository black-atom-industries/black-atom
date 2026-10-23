import { createEmitter } from "./emitter.ts";
import type {
    BackgroundRenderer,
    BackgroundState,
    SceneEvents,
    SceneTheme,
    SingNote,
} from "./types.ts";

type RendererKind = "black-hole" | "iter" | "radar";

const rendererKinds: Record<BackgroundState, RendererKind> = {
    full: "black-hole",
    receded: "black-hole",
    iter: "iter",
    radar: "radar",
};

const loadRenderer: Record<RendererKind, () => Promise<BackgroundRenderer>> = {
    "black-hole": () => import("./black-hole/black-hole.ts").then((m) => m.createBlackHole()),
    iter: () => import("./iter/iter.ts").then((m) => m.createIterScene()),
    radar: () => import("./radar/radar.ts").then((m) => m.createRadarScene()),
};

export interface BackgroundInput {
    state: BackgroundState;
    theme: SceneTheme;
    isStill: boolean;
}

export interface BackgroundController {
    readonly events: SceneEvents;
    update(input: BackgroundInput): void;
    sing(note: SingNote): void;
    pulse(amount: number): void;
    dispose(): void;
}

interface Slot {
    kind: RendererKind;
    isStill: boolean;
    wanted: BackgroundInput;
    renderer?: BackgroundRenderer;
    applied?: BackgroundInput;
}

/**
 * Runs one renderer at a time in `host`. Black-hole states share one renderer and ease between
 * each other; a change to or from a product scene disposes the old renderer before the next starts.
 */
export function createBackgroundController(host: HTMLElement): BackgroundController {
    const events = createEmitter();
    let slot: Slot | undefined;
    let hasWarned = false;
    /** A renderer that failed to start stays off for the session; the theme background shows instead. */
    const failedKinds = new Set<RendererKind>();

    function apply(current: Slot, renderer: BackgroundRenderer) {
        const input = current.wanted;
        if (input.state !== current.applied?.state) renderer.setState(input.state);
        if (input.theme !== current.applied?.theme) renderer.setTheme(input.theme);
        current.applied = input;
    }

    function release() {
        slot?.renderer?.dispose();
        slot = undefined;
    }

    async function mount(input: BackgroundInput) {
        release();
        const current: Slot = {
            kind: rendererKinds[input.state],
            isStill: input.isStill,
            wanted: input,
        };
        slot = current;
        try {
            const renderer = await loadRenderer[current.kind]();
            if (slot !== current) return;
            current.renderer = renderer;
            renderer.events.on((event) => events.emit(event));
            apply(current, renderer);
            await renderer.start(host, { isStill: current.isStill });
            if (slot === current && document.hidden) renderer.pause();
        } catch (error) {
            failedKinds.add(current.kind);
            if (slot === current) release();
            if (!hasWarned) {
                hasWarned = true;
                console.warn("[background] scene unavailable, showing the theme background", error);
            }
        }
    }

    function handleVisibility() {
        if (document.hidden) slot?.renderer?.pause();
        else slot?.renderer?.resume();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return {
        events,
        update(input) {
            if (failedKinds.has(rendererKinds[input.state])) {
                release();
                return;
            }
            if (slot?.kind !== rendererKinds[input.state] || slot.isStill !== input.isStill) {
                void mount(input);
                return;
            }
            slot.wanted = input;
            if (slot.renderer) apply(slot, slot.renderer);
        },
        sing(note) {
            slot?.renderer?.sing(note);
        },
        pulse(amount) {
            slot?.renderer?.pulse(amount);
        },
        dispose() {
            document.removeEventListener("visibilitychange", handleVisibility);
            release();
        },
    };
}
