import type { SceneEvent, SceneEvents } from "./types.ts";

export function createEmitter(): SceneEvents & { emit(event: SceneEvent): void } {
    const listeners = new Set<(event: SceneEvent) => void>();
    return {
        on(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        emit(event) {
            listeners.forEach((listener) => listener(event));
        },
    };
}
