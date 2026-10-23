import { createEmitter } from "./emitter.ts";
import { createGrain, type Grain } from "./grain.ts";
import type { BackgroundRenderer, SceneTheme } from "./types.ts";

export const TAU = Math.PI * 2;

export type Point = [number, number];

export interface Colors2d {
    bg: string;
    sub: string;
    accent: string;
    /** green, yellow, red, cyan, blue, magenta */
    palette: [string, string, string, string, string, string];
    isLight: boolean;
}

interface Viewport {
    width: number;
    height: number;
}

/** Centre and radius of the scene anchor in viewport pixels. */
export interface Frame {
    x: number;
    y: number;
    r: number;
}

export interface Scene2d {
    build(viewport: Viewport, frame: Frame): void;
    draw(t: number, viewport: Viewport, colors: Colors2d): void;
}

function readColors({ vars, appearance }: SceneTheme): Colors2d {
    return {
        bg: vars["--ba-bg"],
        sub: vars["--ba-fg-subtle"],
        accent: vars["--ba-accent"],
        palette: [
            vars["--ba-c-green"],
            vars["--ba-c-yellow"],
            vars["--ba-c-red"],
            vars["--ba-c-cyan"],
            vars["--ba-c-blue"],
            vars["--ba-c-magenta"],
        ],
        isLight: appearance === "light",
    };
}

function anchorFrame({ width, height }: Viewport): Frame {
    const anchor = document.querySelector("[data-scene-anchor]");
    if (!anchor) return { x: width * 0.68, y: height * 0.42, r: Math.min(width, height) * 0.2 };
    const rect = anchor.getBoundingClientRect();
    return {
        x: (rect.left + rect.right) / 2,
        y: (rect.top + rect.bottom) / 2,
        r: Math.min(rect.width, rect.height) * 0.36,
    };
}

/** Time a still frame shows, in seconds: far enough in that the lines have moved off their start. */
const stillTime = 12;

/** Runs a 2D scene on a full-viewport canvas behind the page. */
export function createScene2dRenderer(
    createScene: (context: CanvasRenderingContext2D) => Scene2d,
): BackgroundRenderer {
    const events = createEmitter();
    const listeners = new AbortController();
    let colors: Colors2d | undefined;
    let draw: ((now: number) => void) | undefined;
    let grain: Grain | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let frameId = 0;
    let isRunning = false;
    let isStill = false;

    function loop(now: number) {
        draw?.(now);
        if (isRunning) frameId = requestAnimationFrame(loop);
    }

    return {
        events,
        async start(host, options) {
            isStill = options.isStill;
            const element = document.createElement("canvas");
            const context = element.getContext("2d");
            if (!context) throw new Error("2D canvas unavailable");
            canvas = element;
            host.appendChild(element);
            grain = createGrain();
            grain.setLight(colors?.isLight ?? false);
            const scene = createScene(context);
            const viewport: Viewport = { width: 0, height: 0 };
            const t0 = performance.now();
            let built: Frame = { x: 0, y: 0, r: 0 };

            function rebuild() {
                built = anchorFrame(viewport);
                scene.build(viewport, built);
                if (isStill) draw?.(0);
            }

            function size() {
                viewport.width = innerWidth;
                viewport.height = innerHeight;
                const ratio = Math.min(devicePixelRatio || 1, 1.5);
                element.width = Math.round(viewport.width * ratio);
                element.height = Math.round(viewport.height * ratio);
                context?.setTransform(ratio, 0, 0, ratio, 0, 0);
                rebuild();
            }

            // A client navigation can reset the scroll after the scene starts; follow the anchor until it settles.
            const followUntil = t0 + 1500;
            function followAnchor(now: number) {
                if (listeners.signal.aborted) return;
                const next = anchorFrame(viewport);
                if (
                    Math.abs(next.x - built.x) +
                        Math.abs(next.y - built.y) +
                        Math.abs(next.r - built.r) >
                    1
                ) {
                    rebuild();
                }
                if (now < followUntil) requestAnimationFrame(followAnchor);
            }

            draw = (now) => {
                if (!colors) return;
                context.globalAlpha = 1;
                context.globalCompositeOperation = "source-over";
                context.fillStyle = colors.bg;
                context.fillRect(0, 0, viewport.width, viewport.height);
                scene.draw(isStill ? stillTime : (now - t0) / 1000, viewport, colors);
            };

            size();
            requestAnimationFrame(followAnchor);
            addEventListener("resize", size, { signal: listeners.signal });
            void document.fonts.ready.then(() => {
                if (!listeners.signal.aborted) size();
            });
            if (isStill) {
                draw(0);
                return;
            }
            isRunning = true;
            frameId = requestAnimationFrame(loop);
        },
        setState() {},
        sing() {},
        pulse() {},
        setTheme(theme) {
            colors = readColors(theme);
            grain?.setLight(colors.isLight);
            if (isStill) draw?.(0);
        },
        pause() {
            if (!isRunning) return;
            isRunning = false;
            cancelAnimationFrame(frameId);
        },
        resume() {
            if (isRunning || isStill || !draw || listeners.signal.aborted) return;
            isRunning = true;
            frameId = requestAnimationFrame(loop);
        },
        dispose() {
            listeners.abort();
            isRunning = false;
            cancelAnimationFrame(frameId);
            canvas?.remove();
            grain?.dispose();
        },
    };
}
