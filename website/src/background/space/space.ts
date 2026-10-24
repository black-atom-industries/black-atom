import {
    Color,
    Mesh,
    PerspectiveCamera,
    RenderPipeline,
    Scene,
    WebGPURenderer,
} from "three/webgpu";
import { pass } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { createEmitter } from "#/background/emitter.ts";
import { createGrain } from "#/background/grain.ts";
import { createBlackHole } from "#/background/landmarks/black-hole/black-hole.ts";
import type { BackgroundRenderer, RendererOptions, SceneTheme } from "#/background/types.ts";
import { createCameraRig } from "./camera-rig.ts";
import { look as tunedLook, type Look } from "./look.ts";
import {
    PALETTE_VARS,
    createSpaceUniforms,
    type Colors,
    type Emit,
    type Landmark,
    type LandmarkContext,
} from "./landmark.ts";

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
async function createScene(host: HTMLElement, look: Look, isStill: boolean, emit: Emit) {
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
    const landmarks: Landmark[] = [createBlackHole(context)];

    const pipeline = new RenderPipeline(renderer);
    const scenePass = pass(scene, camera, { samples: 4 });
    const sceneColor = scenePass.getTextureNode("output");
    const output = landmarks.find((landmark) => landmark.lens)?.lens?.(sceneColor) ?? sceneColor;
    const glow = bloom(output, 0.6, 0.35, 0.7);
    pipeline.outputNode = output.add(glow);

    const listeners = new AbortController();
    const { signal } = listeners;
    const rig = createCameraRig({ camera, uniforms: S, look, isStill, emit, signal });

    function measure() {
        const R = rig.measure();
        if (R !== undefined) landmarks.forEach((landmark) => landmark.build(R, isSmall));
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
        if (isStill && stillFrames <= 0) return;
        stillFrames -= 1;
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        frameNumber += 1;
        if (frameNumber % 120 === 1 || now < remeasureUntil) measure();
        grain.tick(isStill ? 0 : now);
        stepColors(dt);
        lightMix += ((isLight ? 1 : 0) - lightMix) * (1 - Math.exp(-dt * 2.6));
        if (Math.abs(lightMix - (isLight ? 1 : 0)) < 0.002) lightMix = isLight ? 1 : 0;
        S.light.value = lightMix;
        if (!isStill) S.time.value += dt;
        glow.strength.value = look.bloom * (1 - 0.7 * lightMix);
        glow.threshold.value = 0.7 + 0.32 * lightMix;

        const { distance, cameraSpeed } = rig.update(dt);
        background.copy(current.bg0).lerp(current.fg, 0.07 * look.lightContrast * lightMix);
        landmarks.forEach((landmark) =>
            landmark.update({
                dt,
                now,
                distance,
                restDistance: rig.restDistance(),
                cameraSpeed,
                isSmall,
                W,
                H,
            }),
        );
        pipeline.render();
        if (!isStill) rig.emitCamera();
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
        setState() {
            remeasureUntil = performance.now() + 1500;
            stillFrames = 2;
            measure();
        },
        setTheme,
        sing: (note: Parameters<NonNullable<Landmark["sing"]>>[0]) =>
            landmarks.forEach((landmark) => landmark.sing?.(note)),
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
            scene.traverse((object) => {
                if (object instanceof Mesh) object.geometry.dispose();
            });
            landmarks.forEach((landmark) => landmark.dispose());
            scenePass.dispose();
            pipeline.dispose();
            renderer.dispose();
            renderer.domElement.remove();
            grain.dispose();
        },
    };
}

/** The background space: the black hole behind the studio and Black Atom pages, receded on the quieter ones. */
export function createSpace(look: Look = tunedLook): BackgroundRenderer {
    const events = createEmitter();
    let scene: Awaited<ReturnType<typeof createScene>> | undefined;
    let theme: SceneTheme | undefined;
    let isDisposed = false;
    let isPaused = false;

    return {
        events,
        async start(host, { isStill }: RendererOptions) {
            const created = await createScene(host, look, isStill, (event) => events.emit(event));
            if (isDisposed) {
                created.dispose();
                return;
            }
            scene = created;
            if (theme) scene.setTheme(theme);
            if (!isPaused) scene.run();
        },
        setState() {
            scene?.setState();
        },
        sing(note) {
            scene?.sing(note);
        },
        pulse(amount) {
            scene?.pulse(amount);
        },
        setTheme(next) {
            theme = next;
            scene?.setTheme(next);
        },
        pause() {
            isPaused = true;
            scene?.pause();
        },
        resume() {
            if (!isPaused) return;
            isPaused = false;
            scene?.run();
        },
        dispose() {
            isDisposed = true;
            scene?.dispose();
        },
    };
}
