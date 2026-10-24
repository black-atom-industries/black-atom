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
    /** True once the scene failed to start; it stays off for the session. */
    readonly hasFailed: boolean;
    /** Calls `listener` when the scene fails to start; returns the unsubscribe. */
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
    /** A renderer that failed to start stays off for the session; the fallback outline shows instead. */
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
            await renderer.start(host, { isStill: current.isStill });
            if (slot === current && document.hidden) renderer.pause();
        } catch (error) {
            hasFailed = true;
            if (slot === current) release();
            failListeners.forEach((listener) => listener());
            if (!hasWarned) {
                hasWarned = true;
                console.warn("[background] scene unavailable, showing the fallback outline", error);
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
        get hasFailed() {
            return hasFailed;
        },
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
