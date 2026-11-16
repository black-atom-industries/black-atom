import { MathUtils } from "three/webgpu";

/** Zoom e-folds per wheel pixel with Ctrl held or a trackpad pinch. */
const WHEEL_ZOOM = 0.006;
/** Most wheel pixels one event counts toward zoom, so a mouse notch takes a step, not the whole range. */
const WHEEL_STEP = 60;
/** Degrees of yaw per sideways wheel pixel. */
const WHEEL_YAW = 0.14;
/** Pixels two fingers' spread must change by before a pinch zooms. */
const PINCH_DEAD_ZONE = 6;
/** Milliseconds after the last Safari gesture event that a gesture counts as over without `gestureend`. */
const GESTURE_IDLE = 300;
/** Pixels per wheel delta unit, by `deltaMode`: pixels, lines, pages. */
const WHEEL_UNIT = [1, 16, 800];

type WheelInput = Pick<WheelEvent, "deltaX" | "deltaY" | "deltaMode" | "ctrlKey" | "shiftKey">;

/**
 * What a wheel event asks of the camera: Ctrl (and a trackpad pinch, which arrives as Ctrl) zooms by
 * a distance factor; a sideways swipe, or Shift with a vertical wheel as Firefox sends it, turns it.
 * Vertical scrolling asks nothing.
 */
export function readWheel({
    deltaX,
    deltaY,
    deltaMode,
    ctrlKey,
    shiftKey,
}: WheelInput): { zoom: number } | { yaw: number } | undefined {
    const unit = WHEEL_UNIT[deltaMode] ?? 1;
    const x = deltaX * unit;
    const y = deltaY * unit;
    if (ctrlKey) {
        return { zoom: Math.exp(MathUtils.clamp(y, -WHEEL_STEP, WHEEL_STEP) * WHEEL_ZOOM) };
    }
    if (shiftKey && Math.abs(y) > Math.abs(x)) return { yaw: y * WHEEL_YAW };
    if (Math.abs(x) > Math.abs(y) * 0.6) return { yaw: x * WHEEL_YAW };
    return undefined;
}

/**
 * The distance factor of a pinch whose fingers moved from `previous` to `current` pixels apart, or
 * nothing while the change stays inside the dead zone, so a two-finger drag doesn't jitter the zoom.
 */
export function pinchStep(previous: number, current: number): number | undefined {
    if (current <= 0 || Math.abs(current - previous) < PINCH_DEAD_ZONE) return undefined;
    return previous / current;
}

/** What the visitor asks of the camera. */
export interface CameraInput {
    /** Multiplies the manual zoom's camera distance by `factor`. */
    zoom(factor: number): void;
    /** Turns the camera by `degrees` around its target. */
    turn(degrees: number): void;
    /** The pointer moved to `x`, `y` in viewport pixels. */
    point(x: number, y: number): void;
}

function touchSpread({ touches }: TouchEvent) {
    const [a, b] = [touches[0], touches[1]];
    if (touches.length !== 2 || !a || !b) return undefined;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/**
 * Listens on the window until `signal` aborts: Ctrl+wheel, a trackpad pinch, Safari's gesture
 * events and a two-finger touch zoom; a sideways swipe or Shift+wheel turns; the pointer adds
 * parallax. Only a Ctrl+wheel, a gesture and a two-finger touchmove are taken from the page.
 */
export function listenToCameraInput(input: CameraInput, signal: AbortSignal) {
    /** Safari's pinch scale at the last gesture event, while a gesture runs. */
    let gestureScale: number | undefined;
    let gestureTimer = 0;
    /** Fingers on the screen, from touch events. */
    let touchCount = 0;
    /** The two fingers' spread when the pinch last zoomed. */
    let pinchDistance: number | undefined;
    let isPinching = false;

    function endGesture() {
        clearTimeout(gestureTimer);
        gestureScale = undefined;
    }

    function handleTouchMove(event: TouchEvent) {
        touchCount = event.touches.length;
        const spread = touchSpread(event);
        if (spread === undefined) return;
        // Two fingers belong to the camera; one finger keeps scrolling the page natively.
        if (event.cancelable) event.preventDefault();
        if (pinchDistance === undefined) {
            pinchDistance = spread;
            return;
        }
        const step = pinchStep(pinchDistance, spread);
        if (step === undefined) return;
        input.zoom(step);
        pinchDistance = spread;
    }

    /** The blocking touchmove listener exists only while two fingers are down. */
    function trackTouches(event: TouchEvent) {
        touchCount = event.touches.length;
        pinchDistance = touchSpread(event);
        if (touchCount >= 2 && !isPinching) {
            isPinching = true;
            addEventListener("touchmove", handleTouchMove, { passive: false, signal });
        } else if (touchCount < 2 && isPinching) {
            isPinching = false;
            removeEventListener("touchmove", handleTouchMove);
        }
    }

    addEventListener(
        "wheel",
        (event) => {
            const read = readWheel(event);
            if (!read) return;
            if ("yaw" in read) {
                input.turn(read.yaw);
                return;
            }
            // The camera takes the pinch instead of the browser's page zoom.
            event.preventDefault();
            if (gestureScale === undefined) input.zoom(read.zoom);
        },
        { passive: false, signal },
    );
    addEventListener(
        "gesturestart",
        (event) => {
            event.preventDefault();
            endGesture();
            gestureScale = 1;
        },
        { passive: false, signal },
    );
    addEventListener(
        "gesturechange",
        (event) => {
            event.preventDefault();
            if (!("scale" in event) || typeof event.scale !== "number" || event.scale <= 0) return;
            clearTimeout(gestureTimer);
            gestureTimer = window.setTimeout(endGesture, GESTURE_IDLE);
            // iOS reports a two-finger pinch as touch events too, which zoom on their own.
            if (gestureScale !== undefined && touchCount < 2)
                input.zoom(gestureScale / event.scale);
            gestureScale = event.scale;
        },
        { passive: false, signal },
    );
    addEventListener("gestureend", endGesture, { passive: true, signal });
    addEventListener("touchstart", trackTouches, { passive: true, signal });
    addEventListener("touchend", trackTouches, { passive: true, signal });
    addEventListener("touchcancel", trackTouches, { passive: true, signal });
    addEventListener("pointermove", (event) => input.point(event.clientX, event.clientY), {
        passive: true,
        signal,
    });
}
