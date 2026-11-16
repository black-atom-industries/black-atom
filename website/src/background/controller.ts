import { createEmitter } from "./emitter.ts";
import type {
    BackgroundRenderer,
    BackgroundState,
    SceneEvents,
    SceneTheme,
    SingNote,
} from "./types.ts";

function loadRenderer(): Promise<BackgroundRenderer> {
    return import("./space/space.ts").then((m) => m.createSpace());
}

export interface BackgroundInput {
    state: BackgroundState;
    theme: SceneTheme;
    isStill: boolean;
}

export interface BackgroundController {
    readonly events: SceneEvents;
    /** Calls `listener` when the scene fails to start or stops while running; returns the unsubscribe. */
    onFail(listener: () => void): () => void;
    update(input: BackgroundInput): void;
    sing(note: SingNote): void;
    pulse(amount: number): void;
    dispose(): void;
}

interface Slot {
    isStill: boolean;
    wanted: BackgroundInput;
    renderer?: BackgroundRenderer;
    applied?: BackgroundInput;
}

/**
 * Runs the space renderer in `host` for every state; it frames each state's landmark. A change of
 * reduced motion disposes the renderer before the next one starts.
 */
export function createBackgroundController(
    host: HTMLElement,
    load: () => Promise<BackgroundRenderer> = loadRenderer,
): BackgroundController {
    const events = createEmitter();
    let slot: Slot | undefined;
    let hasWarned = false;
    /** A renderer that failed stays off for the session; the fallback outline shows instead. */
    let hasFailed = false;
    const failListeners = new Set<() => void>();

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

    /** Turns the scene off for the session: warns once, then tells the layer to show the fallback. */
    function fail(current: Slot, error: unknown) {
        hasFailed = true;
        if (slot === current) release();
        if (!hasWarned) {
            hasWarned = true;
            console.warn("[background] scene unavailable, showing the fallback outline", error);
        }
        failListeners.forEach((listener) => listener());
    }

    async function mount(input: BackgroundInput) {
        release();
        const current: Slot = { isStill: input.isStill, wanted: input };
        slot = current;
        try {
            const renderer = await load();
            if (slot !== current) return;
            current.renderer = renderer;
            renderer.events.on((event) => events.emit(event));
            apply(current, renderer);
            await renderer.start(host, {
                isStill: current.isStill,
                onFail: (error) => {
                    if (slot === current) fail(current, error);
                },
            });
            if (slot === current && document.hidden) renderer.pause();
        } catch (error) {
            fail(current, error);
        }
    }

    function handleVisibility() {
        if (document.hidden) slot?.renderer?.pause();
        else slot?.renderer?.resume();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return {
        events,
        onFail(listener) {
            failListeners.add(listener);
            return () => failListeners.delete(listener);
        },
        update(input) {
            if (hasFailed) {
                release();
                return;
            }
            if (slot?.isStill !== input.isStill) {
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
