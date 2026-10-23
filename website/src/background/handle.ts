import { createEmitter } from "./emitter.ts";
import type { SceneEvents, SingNote } from "./types.ts";

/** The running background as the rest of the app sees it: scene events out, notes and kicks in. */
export interface BackgroundHandle {
    readonly events: SceneEvents;
    sing(note: SingNote): void;
    pulse(amount: number): void;
}

const emitter = createEmitter();
let connected: BackgroundHandle | undefined;

/**
 * Stays valid while backgrounds come and go: listeners keep their subscription, and notes or
 * kicks sent while nothing is connected are dropped.
 */
export const background: BackgroundHandle = {
    events: { on: (listener) => emitter.on(listener) },
    sing: (note) => connected?.sing(note),
    pulse: (amount) => connected?.pulse(amount),
};

export function connectBackground(target: BackgroundHandle): () => void {
    connected = target;
    const unsubscribe = target.events.on((event) => emitter.emit(event));
    return () => {
        unsubscribe();
        if (connected === target) connected = undefined;
    };
}
