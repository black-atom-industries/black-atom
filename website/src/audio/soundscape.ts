import type * as ToneModule from "tone";
import type { z } from "zod";
import type { Appearance } from "#/lib/theme-precedence.ts";
import type { SceneEvent, SingNote } from "#/background/types.ts";

export type Tone = typeof ToneModule;

/** The theme's key as a soundscape hears it: a pitch ratio, and light themes sit an octave up. */
export interface ThemeRoot {
    ratio: number;
    isLight: boolean;
}

/** What a soundscape sends back to the scene. */
export interface SoundscapeVisual {
    sing(note: SingNote): void;
    pulse(amount: number): void;
}

export interface SoundscapeContext {
    tone: Tone;
    context: ToneModule.BaseContext;
    transport: ReturnType<Tone["getTransport"]>;
    /** Dry output into the engine's master chain. */
    bus: ToneModule.InputNode;
    /** Send into the engine's shared reverb. */
    reverb: ToneModule.InputNode;
    visual: SoundscapeVisual;
    random: () => number;
}

export interface Soundscape<Params extends z.AnyZodObject = z.AnyZodObject> {
    readonly id: string;
    /** Every tunable value with its default; `params.parse({})` gives the shipped sound. */
    readonly params: Params;
    readonly layers: readonly string[];
    build(ctx: SoundscapeContext): void;
    onScene(event: SceneEvent): void;
    setParams(partial: Partial<z.infer<Params>>): void;
    setTheme(root: ThemeRoot): void;
    /** Silences the given layers; an empty set plays them all. */
    mute(layers: ReadonlySet<string>): void;
    dispose(): void;
}

/**
 * Picks a root per theme key: dark themes land 5 semitones down to unison, light themes 1 to 6
 * up, so a light key always sits above a dark one. A theme change never repeats the previous root.
 */
export function themeRoot(key: string, appearance: Appearance, previous?: ThemeRoot): ThemeRoot {
    const isLight = appearance === "light";
    const codes = Array.from({ length: key.length }, (_, i) => key.charCodeAt(i));
    const hash = codes.reduce((h, code) => (h * 31 + code) >>> 0, 0);
    const lowest = isLight ? 1 : -5;
    const semitones = lowest + (hash % 6);
    const repeats = previous !== undefined && 2 ** (semitones / 12) === previous.ratio;
    const chosen = repeats ? lowest + ((semitones - lowest + 3) % 6) : semitones;
    return { ratio: 2 ** (chosen / 12), isLight };
}
