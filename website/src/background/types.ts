import type { BackgroundState } from "#/lib/route-background-state.ts";
import type { Appearance } from "#/lib/theme-precedence.ts";
import type { ThemeVar } from "#/lib/theme-vars.ts";

export type { BackgroundState };

export type SceneEvent =
    /** A line meets the hole or the camera. `hue` is the line's colour slot (0..1), `pan` its screen x (-1..1). */
    | { type: "absorb"; hue: number; pan: number; strength: number }
    /** Every frame: camera distance relative to the resting distance (1), and the hole's energy (0..1.6). */
    | { type: "proximity"; distance: number; energy: number }
    /**
     * Smoothed camera speed in view distances per second; the idle orbit alone is about 0.05.
     * `drift` is the sideways direction of travel on screen, from -1 (left) to 1 (right).
     */
    | { type: "camera"; speed: number; drift: number; phase: "start" | "move" | "settle" };

export interface SceneEvents {
    on(listener: (event: SceneEvent) => void): () => void;
}

export interface SceneTheme {
    vars: Record<ThemeVar, string>;
    appearance: Appearance;
}

/** A note from the soundscape that lights one visible line. */
export interface SingNote {
    /** Picks the line; the same pitch keeps its line while the view holds. */
    pitch: number;
    /** Seconds from now until the line lights. */
    delay: number;
    /** Seconds the line stays lit before it fades. */
    duration: number;
    amp: number;
}

interface RendererOptions {
    /** Draw a still frame instead of animating. */
    isStill: boolean;
}

export interface BackgroundRenderer {
    readonly events: SceneEvents;
    /** Rejects when neither WebGPU nor WebGL 2 (or 2D canvas) is available. */
    start(host: HTMLElement, options: RendererOptions): Promise<void>;
    setState(state: BackgroundState): void;
    setTheme(theme: SceneTheme): void;
    /** Lights a line for a note. Scenes without lines ignore it. */
    sing(note: SingNote): void;
    /** A kick now, 0..1; the hole swells and decays over about a second. Scenes without a hole ignore it. */
    pulse(amount: number): void;
    pause(): void;
    resume(): void;
    dispose(): void;
}
