import { Color, PerspectiveCamera, RenderPipeline, Scene, WebGPURenderer } from "three/webgpu";
import { pass } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { createGrain } from "#/background/grain.ts";
import { createBlackHole } from "#/background/landmarks/black-hole/black-hole.ts";
import { flowDir, flowSide } from "#/background/landmarks/black-hole/field.ts";
import { createIter } from "#/background/landmarks/iter/iter.ts";
import type {
    BackgroundRenderer,
    BackgroundState,
    SceneTheme,
    SingNote,
} from "#/background/types.ts";
import { createCameraRig, type Shot } from "./camera-rig.ts";
import { createSpaceRenderer, type SpaceScene } from "./renderer.ts";
import { look as tunedLook, type Look } from "./look.ts";
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
/** Degrees the camera sways either side of iter's ring, so the ring never turns edge-on. */
const ITER_SWAY = 30;
const HOLE_ANCHOR = '[data-scene-anchor="hole"], [data-scene-anchor="far-hole"]';
const WIDE_ANCHOR = '[data-scene-anchor="wide"]';

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

/**
 * Builds the space on a WebGPU renderer (WebGL 2 when WebGPU is missing): one scene and camera that
 * every landmark lives in, with the theme colours, bloom, film grain and the render loop.
 */
async function createScene(
    host: HTMLElement,
    look: Look,
    isStill: boolean,
    emit: Emit,
    state: BackgroundState,
): Promise<SpaceScene> {
    const isWebGPU = await hasWebGPU();
    if (!isWebGPU && !hasWebGL2()) throw new Error("neither WebGPU nor WebGL 2 is available");
    const renderer = new WebGPURenderer({ antialias: true, forceWebGL: !isWebGPU });
    await renderer.init();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 1000 ? 2 : 1.5));
    renderer.domElement.dataset.backend = isWebGPU ? "webgpu" : "webgl2";
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
    const landmarks: Landmark[] = [hole, iter];
    const holeShot: Shot = {
        landmark: hole,
        anchor: HOLE_ANCHOR,
        radius: (rect) => (rect.width / 2) * look.atomSize,
        fallback: (width, height) => ({
            x: width * 0.7,
            y: height * 0.35,
            r: Math.min(width, height) * 0.17 * look.atomSize,
        }),
    };
    const shots: Record<BackgroundState, Shot> = {
        full: holeShot,
        receded: holeShot,
        iter: {
            landmark: iter,
            anchor: WIDE_ANCHOR,
            radius: (rect) => Math.min(rect.width, rect.height) * 0.36,
            sway: ITER_SWAY,
            fallback: (width, height) => ({
                x: width * 0.68,
                y: height * 0.42,
                r: Math.min(width, height) * 0.2,
            }),
        },
        radar: holeShot,
    };

    const pipeline = new RenderPipeline(renderer);
    const scenePass = pass(scene, camera, { samples: 4 });
    const sceneColor = scenePass.getTextureNode("output");
    const output = landmarks.find((landmark) => landmark.lens)?.lens?.(sceneColor) ?? sceneColor;
    const glow = bloom(output, 0.6, 0.35, 0.7);
    pipeline.outputNode = output.add(glow);

    const listeners = new AbortController();
    const { signal } = listeners;
    const rig = createCameraRig({ camera, uniforms: S, look, isStill, emit, signal });
    rig.setShot(shots[state]);
    let builtFor = "";

    function measure() {
        const viewportKey = `${W}|${H}`;
        if (viewportKey !== builtFor) {
            builtFor = viewportKey;
            const R = Math.min(W, H) * WORLD_SCALE * look.atomSize;
            landmarks.forEach((landmark) => landmark.build(R, isSmall));
            rig.reset();
        }
        rig.measure();
    }

    function size() {
        W = innerWidth;
        H = innerHeight;
        isSmall = W < 700;
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
        grain.setLight(isLight);
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

    const grain = createGrain();
    size();
    measure();

    let last = performance.now();
    let frameNumber = 0;
    let remeasureUntil = 0;

    function render() {
        const current = colors;
        if (!current || !rig.hasFrame) return;
        if (isStill && stillFrames <= 0 && !rig.isCutPending) return;
        stillFrames -= 1;
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        frameNumber += 1;
        if (frameNumber % 120 === 1 || now < remeasureUntil || rig.isCutPending) measure();
        grain.tick(isStill ? 0 : now);
        stepColors(dt);
        lightMix += ((isLight ? 1 : 0) - lightMix) * (1 - Math.exp(-dt * 2.6));
        if (Math.abs(lightMix - (isLight ? 1 : 0)) < 0.002) lightMix = isLight ? 1 : 0;
        S.light.value = lightMix;
        if (!isStill) S.time.value += dt;
        glow.strength.value = look.bloom * (1 - 0.7 * lightMix);
        glow.threshold.value = 0.7 + 0.32 * lightMix;

        const { viewDistance, cameraSpeed, cut } = rig.update(dt);
        const active = rig.landmark;
        background.copy(current.bg0).lerp(current.fg, 0.07 * look.lightContrast * lightMix);
        landmarks.forEach((landmark) =>
            landmark.update({
                dt,
                now,
                distance: camera.position.distanceTo(landmark.position),
                viewDistance,
                cameraSpeed,
                cut,
                isActive: landmark === active,
                isSmall,
                W,
                H,
            }),
        );
        pipeline.render();
        if (!isStill) {
            emit({
                type: "proximity",
                distance: viewDistance / rig.restDistance(),
                energy: active?.energy ?? 0,
            });
            rig.emitCamera();
        }
    }

    let hasFailed = false;
    function tick() {
        try {
            render();
        } catch (error) {
            if (!hasFailed) {
                hasFailed = true;
                console.warn("[background] space stopped", error);
            }
            void renderer.setAnimationLoop(null);
        }
    }

    return {
        setState(next: BackgroundState) {
            rig.setShot(shots[next]);
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
            clearTimeout(resizeTimer);
            void renderer.setAnimationLoop(null);
            landmarks.forEach((landmark) => landmark.dispose());
            scenePass.dispose();
            pipeline.dispose();
            renderer.dispose();
            renderer.domElement.remove();
            grain.dispose();
        },
    };
}

/**
 * The background space: the black hole behind the studio and Black Atom pages, receded on the
 * quieter ones, and iter's review cycle on its page.
 */
export function createSpace(look: Look = tunedLook): BackgroundRenderer {
    return createSpaceRenderer((host, isStill, emit, state) =>
        createScene(host, look, isStill, emit, state),
    );
}
