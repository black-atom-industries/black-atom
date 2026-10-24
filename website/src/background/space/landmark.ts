import { Color, Vector3, type Node, type PerspectiveCamera, type Scene } from "three/webgpu";
import { uniform, type pass } from "three/tsl";
import type { createEmitter } from "#/background/emitter.ts";
import type { SingNote } from "#/background/types.ts";
import type { Look } from "./look.ts";

export const PALETTE_VARS = [
    "--ba-c-red",
    "--ba-c-yellow",
    "--ba-c-green",
    "--ba-c-cyan",
    "--ba-c-blue",
    "--ba-c-magenta",
    "--ba-c-gray",
] as const;

export type Emit = ReturnType<typeof createEmitter>["emit"];

export interface Colors {
    bg0: Color;
    fg: Color;
    acc: Color[];
    pal: Color[];
}

/** Uniforms the space drives and every landmark reads. */
export function createSpaceUniforms() {
    return {
        time: uniform(0),
        /** 0 on dark themes, 1 on light ones, eased between. */
        light: uniform(0),
        nAcc: uniform(2),
        acc: [0, 1, 2, 3].map(() => uniform(new Color())),
        pal: PALETTE_VARS.map(() => uniform(new Color())),
        camR: uniform(new Vector3(1, 0, 0)),
        camU: uniform(new Vector3(0, 1, 0)),
        /** Line width factor that keeps tubes their screen width while the camera pulls back. */
        thick: uniform(1),
        focus: uniform(1200),
        fogStart: uniform(1200),
    };
}

export type SpaceUniforms = ReturnType<typeof createSpaceUniforms>;

export type SceneColorNode = ReturnType<ReturnType<typeof pass>["getTextureNode"]>;

export interface LandmarkContext {
    scene: Scene;
    camera: PerspectiveCamera;
    uniforms: SpaceUniforms;
    look: Look;
    isStill: boolean;
    emit: Emit;
    colors: () => Colors | undefined;
}

export interface LandmarkFrame {
    dt: number;
    now: number;
    /** Camera distance from this landmark. */
    distance: number;
    /** Camera distance from the active landmark, which it looks at; the same for every landmark. */
    viewDistance: number;
    /** Smoothed camera speed in view distances per second. */
    cameraSpeed: number;
    /** The camera jumped this frame; its move since the last frame is no motion. */
    cut: boolean;
    /** This landmark is the one the camera targets. */
    isActive: boolean;
    isSmall: boolean;
    W: number;
    H: number;
}

/** One object in the space, with everything it draws and the events it sends. */
export interface Landmark {
    /** World position the camera targets when this landmark is active; set by `build`. */
    readonly position: Vector3;
    /** World radius a shot frames; set by `build`. */
    readonly radius: number;
    /** Energy (0..1.6) the `proximity` event carries while this landmark is active. */
    readonly energy?: number;
    /** Builds the geometry around world radius `R`, once per viewport size. */
    build(R: number, isSmall: boolean): void;
    /**
     * Wraps the rendered scene colour before bloom, once when the pipeline is made. A lens samples
     * the scene texture, so lenses don't chain: at most one landmark has one.
     */
    lens?: (color: SceneColorNode) => Node<"vec4">;
    /** Runs every frame after the camera has moved and before the frame renders. */
    update(frame: LandmarkFrame): void;
    sing?(note: SingNote): void;
    pulse?(amount: number): void;
    /** Disposes every geometry and material the landmark made. */
    dispose(): void;
}
