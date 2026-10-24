import {
    Color,
    PerspectiveCamera,
    RenderPipeline,
    Scene,
    Vector3,
    WebGPURenderer,
} from "three/webgpu";
import { pass } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { createBlackHole } from "#/background/landmarks/black-hole/black-hole.ts";
import { flowDir, flowSide } from "./axes.ts";
import { createIter } from "#/background/landmarks/iter/iter.ts";
import { createRadar } from "#/background/landmarks/radar/radar.ts";
import type {
    BackgroundRenderer,
    BackgroundState,
    SceneTheme,
    SingNote,
} from "#/background/types.ts";
import type { LandmarkKey } from "#/lib/route-background-state.ts";
import { createCameraRig, type Shot } from "./camera-rig.ts";
import { createSpaceRenderer, type SpaceScene } from "./renderer.ts";
import { look as tunedLook, type Look } from "./look.ts";
import { wideFrame, wideTarget } from "./wide.ts";
import {
    PALETTE_VARS,
    createSpaceUniforms,
    type Colors,
    type Emit,
    type Landmark,
    type LandmarkContext,
} from "./landmark.ts";

/** World radius per pixel of `min(W, H)`, before `atomSize`: the hole anchor's half width on a desktop. */
const WORLD_SCALE = 0.28;
/** Where iter sits, in world radii from the black hole at the origin: downstream and to one side. */
const ITER_PLACE = flowDir.clone().multiplyScalar(14).addScaledVector(flowSide, 7);
/** Where radar sits: downstream like iter, on the other side of the flow. */
const RADAR_PLACE = flowDir.clone().multiplyScalar(14).addScaledVector(flowSide, -7);
/** Degrees the camera sways either side of a product landmark, so its face never turns edge-on. */
const PRODUCT_SWAY = 30;
/** Screen radius of the wide shot's frame, as a share of `min(W, H)`, full and receded. */
const WIDE_FILL = 0.47;
const WIDE_RECEDED_FILL = 0.32;
/** The hole's line presence on the wide shot, where it is one of three landmarks. */
const WIDE_HOLE_PRESENCE = 0.3;
/** On light themes the hole's lines recede further on the wide shot, so the text stays clean. */
const WIDE_HOLE_PRESENCE_LIGHT = 0.05;
const HOLE_ANCHOR = '[data-scene-anchor="hole"], [data-scene-anchor="far-hole"]';
const WIDE_ANCHOR = '[data-scene-anchor="wide"]';
const SQUARE_ANCHOR = '[data-scene-anchor="square"]';

async function hasWebGPU(): Promise<boolean> {
    if (!("gpu" in navigator)) return false;
    try {
        return (await navigator.gpu.requestAdapter()) !== null;
    } catch {
        return false;
    }
}

function hasWebGL2(): boolean {
    return document.createElement("canvas").getContext("webgl2") !== null;
}

function themeColors({ vars }: SceneTheme): Colors & { accentCount: number } {
    const color = (hex: string) => new Color().setStyle(hex);
    const acc = [color(vars["--ba-accent"]), color(vars["--ba-accent-2"])];
    const accentCount = acc.length;
    while (acc.length < 4) acc.push((acc.at(-1) ?? new Color()).clone());
    return {
        bg0: color(vars["--ba-bg"]),
        fg: color(vars["--ba-fg"]),
        acc,
        pal: PALETTE_VARS.map((name) => color(vars[name])),
        accentCount,
    };
}

function pixelRatio(): number {
    return Math.min(devicePixelRatio || 1, innerWidth < 1000 ? 2 : 1.5);
}

/**
 * Starts a WebGPU renderer (WebGL 2 when WebGPU is missing) and builds the space on it. A space
 * that fails to build takes its renderer and canvas with it.
 */
async function createScene(
    host: HTMLElement,
    look: Look,
    isStill: boolean,
    emit: Emit,
    state: BackgroundState,
    fail: (error: unknown) => void,
): Promise<SpaceScene> {
    const isWebGPU = await hasWebGPU();
    if (!isWebGPU && !hasWebGL2()) throw new Error("neither WebGPU nor WebGL 2 is available");
    const renderer = new WebGPURenderer({ forceWebGL: !isWebGPU });
    await renderer.init();
    renderer.domElement.dataset.backend = isWebGPU ? "webgpu" : "webgl2";
    try {
        return buildSpace(renderer, host, look, isStill, emit, state, fail);
    } catch (error) {
        renderer.dispose();
        renderer.domElement.remove();
        throw error;
    }
}

/**
 * Builds the space: one scene and camera that every landmark lives in, with the theme colours,
 * bloom and the render loop. `fail` reports a space that stopped for good while running.
 */
function buildSpace(
    renderer: WebGPURenderer,
    host: HTMLElement,
    look: Look,
    isStill: boolean,
    emit: Emit,
    state: BackgroundState,
    fail: (error: unknown) => void,
): SpaceScene {
    renderer.setPixelRatio(pixelRatio());
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, 1, 5, 40000);
    const S = createSpaceUniforms();
    let W = 0;
    let H = 0;
    let isSmall = innerWidth < 700;
    let colors: Colors | undefined;
    let colorTarget: Colors | undefined;
    let isLight = false;
    let lightMix = 0;
    let stillFrames = 2;

    const context: LandmarkContext = {
        scene,
        camera,
        uniforms: S,
        look,
        isStill,
        emit,
        colors: () => colors,
    };
    const hole = createBlackHole(context);
    const iter = createIter(context, ITER_PLACE);
    const radar = createRadar(context, RADAR_PLACE);
    const byKey: Record<LandmarkKey, Landmark> = { hole, iter, radar };
    const landmarks: Landmark[] = [hole, iter, radar];
    const landmarkShots: Record<LandmarkKey, Shot> = {
        hole: {
            target: hole,
            anchor: {
                selector: HOLE_ANCHOR,
                radius: (rect) => (rect.width / 2) * look.atomSize,
            },
            fallback: (width, height) => ({
                x: width * 0.7,
                y: height * 0.35,
                r: Math.min(width, height) * 0.17 * look.atomSize,
            }),
        },
        iter: {
            target: iter,
            anchor: {
                selector: WIDE_ANCHOR,
                radius: (rect) => Math.min(rect.width, rect.height) * 0.36,
            },
            sway: PRODUCT_SWAY,
            fallback: (width, height) => ({
                x: width * 0.68,
                y: height * 0.42,
                r: Math.min(width, height) * 0.2,
            }),
        },
        radar: {
            target: radar,
            anchor: {
                selector: SQUARE_ANCHOR,
                radius: (rect) => Math.min(rect.width, rect.height) * 0.24,
            },
            sway: PRODUCT_SWAY,
            fallback: (width, height) => ({
                x: width * 0.68,
                y: height * 0.42,
                r: Math.min(width, height) * 0.25,
            }),
        },
    };
    /** Wide targets by focus: the centroid of the landmarks, or drifted toward one of them. */
    const wideTargets = new Map<LandmarkKey | undefined, { position: Vector3; radius: number }>();
    const wideShots = new Map<string, Shot>();

    /** Places the wide targets around the landmarks as built, framing all three with margin. */
    function placeWide() {
        const foci: (LandmarkKey | undefined)[] = [undefined, "hole", "iter", "radar"];
        foci.forEach((focus) => {
            const { position, radius } = wideTarget(
                landmarks,
                focus ? byKey[focus].position : undefined,
            );
            const wide = wideTargets.get(focus);
            if (wide) {
                wide.position.copy(position);
                wide.radius = radius;
            } else {
                wideTargets.set(focus, { position, radius });
            }
        });
    }

    function shotFor({ view, mode, focus }: BackgroundState): Shot {
        if (view !== "wide") return landmarkShots[view];
        const key = `${mode}|${focus ?? ""}`;
        const cached = wideShots.get(key);
        if (cached) return cached;
        const fill = mode === "receded" ? WIDE_RECEDED_FILL : WIDE_FILL;
        const target = wideTargets.get(focus) ?? { position: new Vector3(), radius: 1 };
        wideTargets.set(focus, target);
        const shot: Shot = {
            target,
            sway: PRODUCT_SWAY,
            fallback: (width, height) => wideFrame(width, height, fill),
        };
        wideShots.set(key, shot);
        return shot;
    }

    let shown = state;

    /** A landmark's presence on the wide shot, where all three share the frame. */
    function widePresenceOf(landmark: Landmark): number {
        if (landmark !== hole) return 1;
        return WIDE_HOLE_PRESENCE + (WIDE_HOLE_PRESENCE_LIGHT - WIDE_HOLE_PRESENCE) * lightMix;
    }

    /**
     * How much a landmark is the subject of the current shot, 0..1. Zooming out by hand eases it
     * toward the wide shot's presence as the camera nears the wide distance.
     */
    function presenceOf(landmark: Landmark): number {
        const wide = widePresenceOf(landmark);
        if (shown.view === "wide") return wide;
        const own = byKey[shown.view] === landmark ? 1 : 0;
        return own + (wide - own) * rig.wideness;
    }

    const pipeline = new RenderPipeline(renderer);
    const scenePass = pass(scene, camera, { samples: 4 });
    const sceneColor = scenePass.getTextureNode("output");
    const output = landmarks.find((landmark) => landmark.lens)?.lens?.(sceneColor) ?? sceneColor;
    const glow = bloom(output, 0.6, 0.35, 0.7);
    pipeline.outputNode = output.add(glow);

    const listeners = new AbortController();
    const { signal } = listeners;
    const rig = createCameraRig({
        camera,
        uniforms: S,
        look,
        isStill,
        emit,
        signal,
        wide: shotFor({ view: "wide", mode: "full" }),
    });
    // The page hands pinches to the camera only while a scene is there to take them.
    document.documentElement.dataset.scene = "running";
    let builtFor = "";

    function measure() {
        const viewportKey = `${W}|${H}`;
        if (viewportKey !== builtFor) {
            builtFor = viewportKey;
            const R = Math.min(W, H) * WORLD_SCALE * look.atomSize;
            landmarks.forEach((landmark) => landmark.build(R, isSmall));
            placeWide();
            rig.reset();
        }
        rig.measure();
    }

    function size() {
        W = innerWidth;
        H = innerHeight;
        isSmall = W < 700;
        renderer.setPixelRatio(pixelRatio());
        renderer.setSize(W, H);
        rig.resize(W, H);
    }

    const background = new Color();

    function pushColors(current: Colors) {
        S.acc.forEach((u, k) => u.value.copy(current.acc[k]));
        S.pal.forEach((u, k) => u.value.copy(current.pal[k]));
    }

    function setTheme(theme: SceneTheme) {
        const next = themeColors(theme);
        isLight = theme.appearance === "light";
        S.nAcc.value = next.accentCount;
        if (!colors || isStill) {
            colors = next;
            colorTarget = undefined;
            lightMix = isLight ? 1 : 0;
        } else {
            colorTarget = next;
        }
        scene.background = background;
        pushColors(colors);
        stillFrames = 2;
    }

    function stepColors(dt: number) {
        if (!colors || !colorTarget) return;
        const k = 1 - Math.exp(-dt * 2.6);
        const current = colors;
        const next = colorTarget;
        current.bg0.lerp(next.bg0, k);
        current.fg.lerp(next.fg, k);
        current.acc.forEach((c, i) => c.lerp(next.acc[i], k));
        current.pal.forEach((c, i) => c.lerp(next.pal[i], k));
        pushColors(current);
        const left =
            Math.abs(current.bg0.r - next.bg0.r) +
            Math.abs(current.fg.g - next.fg.g) +
            Math.abs(current.acc[0].b - next.acc[0].b);
        if (left < 0.0005) colorTarget = undefined;
    }

    let resizeTimer = 0;
    addEventListener(
        "resize",
        () => {
            clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                size();
                measure();
                stillFrames = 2;
            }, 180);
        },
        { signal },
    );
    void document.fonts.ready.then(() => {
        if (!signal.aborted) measure();
    });

    rig.setShot(shotFor(state), false);
    size();
    measure();

    let last = performance.now();
    let frameNumber = 0;
    let remeasureUntil = 0;
    /** The manual zoom in hundredths that `data-zoom` shows. */
    let shownZoom = Number.NaN;
    /** Flights since the space started, shown as `data-flights`; a still background only cuts. */
    let flightCount = 0;
    /** A still background has drawn its frame and waits, shown as `data-frame="still"`. */
    let isResting = false;

    function render() {
        const current = colors;
        if (!current || !rig.hasFrame) return;
        if (isStill && stillFrames <= 0 && !rig.isCutPending && !rig.isManualPending) {
            if (!isResting) {
                isResting = true;
                host.dataset.frame = "still";
            }
            return;
        }
        if (isResting) {
            isResting = false;
            delete host.dataset.frame;
        }
        stillFrames -= 1;
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        frameNumber += 1;
        if (frameNumber % 120 === 1 || now < remeasureUntil || rig.isCutPending) measure();
        stepColors(dt);
        lightMix += ((isLight ? 1 : 0) - lightMix) * (1 - Math.exp(-dt * 2.6));
        if (Math.abs(lightMix - (isLight ? 1 : 0)) < 0.002) lightMix = isLight ? 1 : 0;
        S.light.value = lightMix;
        if (!isStill) S.time.value += dt;
        glow.strength.value = look.bloom * (1 - 0.7 * lightMix);
        glow.threshold.value = 0.7 + 0.32 * lightMix;

        const { viewDistance, cameraSpeed, cut } = rig.update(dt);
        const zoom = Math.round(rig.manualZoom * 100);
        if (zoom !== shownZoom) {
            shownZoom = zoom;
            host.dataset.zoom = (zoom / 100).toFixed(2);
        }
        background.copy(current.bg0).lerp(current.fg, 0.07 * look.lightContrast * lightMix);
        landmarks.forEach((landmark) =>
            landmark.update({
                dt,
                now,
                distance: camera.position.distanceTo(landmark.position),
                viewDistance,
                cameraSpeed,
                cut,
                presence: presenceOf(landmark),
                soundShare: shown.view === "wide" ? 1 / landmarks.length : 1,
                W,
                H,
            }),
        );
        pipeline.render();
        if (!isStill) {
            emit({
                type: "proximity",
                distance: viewDistance / rig.restDistance(),
                energy: shown.view === "wide" ? 0 : (byKey[shown.view].energy ?? 0),
            });
            rig.emitCamera();
        }
    }

    let hasStopped = false;
    /**
     * Stops the space for good after a lost device or a failed frame: the loop ends, a pinch and
     * Ctrl+wheel go back to zooming the page, and the controller swaps in the fallback.
     */
    function stop(error: unknown) {
        if (hasStopped) return;
        hasStopped = true;
        listeners.abort();
        delete document.documentElement.dataset.scene;
        void renderer.setAnimationLoop(null);
        fail(error);
    }
    renderer.onDeviceLost = (info) => stop(new Error(`GPU device lost: ${info.message}`));

    function tick() {
        try {
            render();
        } catch (error) {
            stop(error);
        }
    }

    return {
        setState(next: BackgroundState) {
            shown = next;
            if (rig.setShot(shotFor(next), !isStill)) {
                flightCount += 1;
                host.dataset.flights = String(flightCount);
            }
            rig.resetManual();
            remeasureUntil = performance.now() + 1500;
            stillFrames = 2;
            measure();
        },
        setTheme,
        sing: (note: SingNote) => landmarks.forEach((landmark) => landmark.sing?.(note)),
        pulse: (amount: number) => landmarks.forEach((landmark) => landmark.pulse?.(amount)),
        run() {
            last = performance.now();
            void renderer.setAnimationLoop(tick);
        },
        pause() {
            void renderer.setAnimationLoop(null);
        },
        dispose() {
            listeners.abort();
            delete document.documentElement.dataset.scene;
            clearTimeout(resizeTimer);
            void renderer.setAnimationLoop(null);
            renderer.domElement.remove();
            try {
                landmarks.forEach((landmark) => landmark.dispose());
                glow.dispose();
                scenePass.dispose();
                pipeline.dispose();
                renderer.dispose();
            } catch (error) {
                // After a lost device, releasing GPU resources can throw; the space is gone either way.
                if (!hasStopped) throw error;
            }
        },
    };
}

/**
 * The background space: the black hole, iter and radar in one field, framed by the shot each page
 * asks for, from one landmark to the wide shot of all three.
 */
export function createSpace(look: Look = tunedLook): BackgroundRenderer {
    return createSpaceRenderer((host, isStill, emit, state, fail) =>
        createScene(host, look, isStill, emit, state, fail),
    );
}
