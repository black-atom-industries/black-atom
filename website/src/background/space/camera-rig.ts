import { MathUtils, Vector3, type PerspectiveCamera } from "three/webgpu";
import type { Look } from "./look.ts";
import type { Emit, Landmark, SpaceUniforms } from "./landmark.ts";

/** Camera speed (view distances per second) above which the camera counts as moving. */
const MOVING_SPEED = 0.12;
const SETTLED_SPEED = 0.08;
/** Frames a cut waits for the new page's anchor once the old page's anchor is gone. */
const CUT_FRAMES = 2;
/** Frames a cut waits at most, while the new route is still loading. */
const CUT_LIMIT = 90;

interface Frame {
    x: number;
    y: number;
    /** Screen radius in pixels of the landmark's `radius`. */
    r: number;
}

/** What the camera frames: a landmark, placed on screen by the page's anchor. */
export interface Shot {
    landmark: Landmark;
    /** Selector for the anchor elements this shot reads. */
    anchor: string;
    /** Screen radius of the landmark's `radius` for an anchor of this size. */
    radius(rect: DOMRect): number;
    /** Framing in viewport pixels for a page without the anchor. */
    fallback(W: number, H: number): Frame;
    /** Degrees the idle orbit sways either side of face-on; without it the camera circles. */
    sway?: number;
}

export interface CutWait {
    /** The shot's landmark differs from the one the camera frames. */
    isCutting: boolean;
    /** The new shot's anchor is on the page. */
    hasAnchor: boolean;
    /** The framed shot's anchor is still on the page: the new route hasn't rendered yet. */
    hasOldAnchor: boolean;
    /** Measures since the cut was asked for. */
    waited: number;
    /** Measures since the old page's anchor went. */
    settled: number;
}

/**
 * Whether a measure frames its shot now. A cut to another landmark waits for the new page's
 * anchor while the old page still shows, then a frame or two more, so a page without the anchor
 * falls back at once and a page whose route is loading doesn't land on the fallback framing.
 */
export function shouldFrame({ isCutting, hasAnchor, hasOldAnchor, waited, settled }: CutWait) {
    if (!isCutting || hasAnchor || waited >= CUT_LIMIT) return true;
    return !hasOldAnchor && settled >= CUT_FRAMES;
}

interface RigOptions {
    camera: PerspectiveCamera;
    uniforms: SpaceUniforms;
    look: Look;
    isStill: boolean;
    emit: Emit;
    signal: AbortSignal;
}

/**
 * Places the camera around the active landmark: the page's anchor sets where it sits on screen and
 * how large, scrolling looks around, the pointer adds parallax and a sideways swipe turns the view.
 */
export function createCameraRig({ camera, uniforms: S, look, isStill, emit, signal }: RigOptions) {
    const html = document.documentElement;
    let W = 0;
    let H = 0;
    let D = 1000;
    let pageHeight = 0;
    let shot: Shot | undefined;
    /** The shot the camera frames; trails `shot` while a cut waits for its anchor. */
    let framed: Shot | undefined;
    let target: Frame = { x: 0, y: 0, r: 100 };
    let frame: Frame | undefined;
    let lastFrameX = 0;
    let lastFrameY = 0;
    let needsSnap = true;
    let waited = 0;
    let settled = 0;
    /** True until the camera has a position to measure motion from. */
    let isCut = true;

    let yaw = 0;
    let yawSmooth = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let scroll = 0;
    let orbitAngle = 0;
    let swayPhase = 0;
    let cameraSpeed = 0;
    let cameraDrift = 0;
    let isMoving = false;
    const camPrevious = new Vector3();
    const camStep = new Vector3();
    const camRight = new Vector3();

    addEventListener(
        "wheel",
        (event) => {
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.6) yaw += event.deltaX * 0.14;
        },
        { passive: true, signal },
    );
    addEventListener(
        "pointermove",
        (event) => {
            pointerTargetX = (event.clientX / W) * 2 - 1;
            pointerTargetY = (event.clientY / H) * 2 - 1;
        },
        { passive: true, signal },
    );

    return {
        get hasFrame() {
            return frame !== undefined;
        },
        resize(width: number, height: number) {
            W = width;
            H = height;
            camera.aspect = W / H;
            D = H / 2 / Math.tan(MathUtils.degToRad(camera.fov / 2));
            camera.updateProjectionMatrix();
        },

        /** The landmark the camera targets. */
        get landmark(): Landmark | undefined {
            return framed?.landmark;
        },

        get isCutPending() {
            return framed !== undefined && shot?.landmark !== framed.landmark;
        },

        /** Frames `next`. A change of landmark cuts once the new page's anchor is there. */
        setShot(next: Shot) {
            if (next.landmark !== shot?.landmark) waited = settled = 0;
            shot = next;
        },

        /** Snaps the framing at the next measure and counts the next frame as a cut. */
        reset() {
            needsSnap = true;
        },

        /** Reads the shot's anchor and sets where the landmark sits on screen and how large. */
        measure() {
            if (!shot) return;
            const scrollY = window.scrollY;
            pageHeight = html.scrollHeight;
            const anchor = document.querySelector(shot.anchor);
            const isCutting = framed !== undefined && shot.landmark !== framed.landmark;
            const hasOldAnchor = isCutting && document.querySelector(framed?.anchor ?? "") !== null;
            const wait = { isCutting, hasAnchor: anchor !== null, hasOldAnchor, waited, settled };
            if (!shouldFrame(wait)) {
                waited += 1;
                if (!hasOldAnchor) settled += 1;
                return;
            }
            if (anchor) {
                const rect = anchor.getBoundingClientRect();
                target = {
                    x: (rect.left + rect.right) / 2,
                    y: (rect.top + rect.bottom) / 2 + scrollY,
                    r: shot.radius(rect),
                };
            } else {
                target = shot.fallback(W, H);
            }
            if (!frame || isCutting || needsSnap) {
                frame = { ...target };
                lastFrameX = frame.x;
                lastFrameY = frame.y;
                needsSnap = false;
                isCut = true;
            }
            // A cut opens on the landmark's resting view, as a direct load of the page does.
            if (isCutting) orbitAngle = swayPhase = 0;
            framed = shot;
        },

        /** Moves the camera for this frame; returns its distance from the target, smoothed speed and whether it cut. */
        update(dt: number) {
            if (!frame || !framed) return { viewDistance: D, cameraSpeed, cut: true };
            const { landmark, sway } = framed;
            // A smaller anchor pulls the camera back instead of rebuilding; `thick` keeps the lines' screen width.
            const ease = isStill ? 1 : 1 - Math.exp(-dt * 2.2);
            frame.x += (target.x - frame.x) * ease;
            frame.y += (target.y - frame.y) * ease;
            frame.r += (target.r - frame.r) * ease;
            const framingSpeed =
                Math.hypot(frame.x - lastFrameX, frame.y - lastFrameY) / H / Math.max(dt, 1e-3);
            const framingDriftX = (lastFrameX - frame.x) / H / Math.max(dt, 1e-3);
            lastFrameX = frame.x;
            lastFrameY = frame.y;

            const k = 1 - Math.exp(-dt * 3);
            pointerX += (pointerTargetX - pointerX) * k;
            pointerY += (pointerTargetY - pointerY) * k;
            const progress = MathUtils.clamp(window.scrollY / Math.max(1, pageHeight - H), 0, 1);
            scroll += (progress - scroll) * (1 - Math.exp(-dt * 5));
            yawSmooth += (yaw - yawSmooth) * (1 - Math.exp(-dt * 4));
            if (!isStill) {
                orbitAngle -= dt * look.orbit;
                if (sway) swayPhase += (dt * look.orbit) / sway;
            }
            const idle = sway ? sway * Math.sin(swayPhase) : orbitAngle;
            const yawAngle = MathUtils.degToRad(
                -80 * scroll * look.lookAround + yawSmooth + idle + pointerX * 6 * look.parallax,
            );
            const pitch = MathUtils.degToRad(
                (4 + 34 * scroll) * look.lookAround - pointerY * 4 * look.parallax,
            );
            const thick = landmark.radius / frame.r;
            const distance = D * (1 + 0.55 * scroll * look.lookAround) * thick;
            S.thick.value = thick;
            camera.position
                .set(
                    Math.sin(yawAngle) * Math.cos(pitch),
                    Math.sin(pitch),
                    Math.cos(yawAngle) * Math.cos(pitch),
                )
                .multiplyScalar(distance)
                .add(landmark.position);
            if (isCut) camPrevious.copy(camera.position);
            const cameraMove =
                camPrevious.distanceTo(camera.position) / distance / Math.max(dt, 1e-3);
            camRight.setFromMatrixColumn(camera.matrixWorld, 0);
            const sideways =
                camStep.subVectors(camera.position, camPrevious).dot(camRight) /
                    distance /
                    Math.max(dt, 1e-3) +
                framingDriftX;
            camPrevious.copy(camera.position);
            cameraSpeed += (cameraMove + framingSpeed - cameraSpeed) * (1 - Math.exp(-dt * 8));
            cameraDrift +=
                (MathUtils.clamp(sideways * 2, -1, 1) - cameraDrift) * (1 - Math.exp(-dt * 8));
            camera.lookAt(landmark.position);
            camera.setViewOffset(W, H, W / 2 - frame.x, H / 2 - frame.y, W, H);
            camera.updateMatrixWorld();
            S.focus.value = distance;
            S.fogStart.value = distance * 0.9;
            S.camR.value.setFromMatrixColumn(camera.matrixWorld, 0);
            S.camU.value.setFromMatrixColumn(camera.matrixWorld, 1);
            const cut = isCut;
            if (!isStill) isCut = false;
            return { viewDistance: distance, cameraSpeed, cut };
        },

        emitCamera() {
            if (!isMoving && cameraSpeed > MOVING_SPEED) {
                isMoving = true;
                emit({ type: "camera", speed: cameraSpeed, drift: cameraDrift, phase: "start" });
            } else if (isMoving && cameraSpeed < SETTLED_SPEED) {
                isMoving = false;
                emit({ type: "camera", speed: cameraSpeed, drift: cameraDrift, phase: "settle" });
            } else if (isMoving) {
                emit({ type: "camera", speed: cameraSpeed, drift: cameraDrift, phase: "move" });
            }
        },

        restDistance() {
            return D;
        },
    };
}
