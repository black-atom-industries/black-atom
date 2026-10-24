import { MathUtils, Vector3, type PerspectiveCamera } from "three/webgpu";
import type { Look } from "./look.ts";
import type { Emit, SpaceUniforms } from "./landmark.ts";

/** Camera speed (view distances per second) above which the camera counts as moving. */
const MOVING_SPEED = 0.12;
const SETTLED_SPEED = 0.08;

interface Frame {
    x: number;
    y: number;
    /** Hole radius in screen pixels. */
    r: number;
}

function holeAnchor(): Element | null {
    return document.querySelector('[data-scene-anchor="hole"], [data-scene-anchor="far-hole"]');
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
 * Places the camera: the page's anchor sets where the hole sits on screen and how large, scrolling
 * looks around, the pointer adds parallax and a sideways swipe turns the view.
 */
export function createCameraRig({ camera, uniforms: S, look, isStill, emit, signal }: RigOptions) {
    const html = document.documentElement;
    let W = 0;
    let H = 0;
    let D = 1000;
    let pageHeight = 0;
    let builtFor = "";
    /** World radius the landmarks were built around. */
    let buildR = 100;
    let target: Frame = { x: 0, y: 0, r: 100 };
    let frame: Frame | undefined;
    let lastFrameX = 0;
    let lastFrameY = 0;
    /** False until the camera has a position to measure motion from. */
    let hasCameraPosition = false;

    let yaw = 0;
    let yawSmooth = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let scroll = 0;
    let orbitAngle = 0;
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

        /**
         * Reads the hole anchor. Returns the world radius to build the landmarks around when the
         * viewport changed; a different anchor later moves the camera instead of rebuilding.
         */
        measure(): number | undefined {
            const scrollY = window.scrollY;
            pageHeight = html.scrollHeight;
            const anchor = holeAnchor();
            if (anchor) {
                const rect = anchor.getBoundingClientRect();
                target = {
                    x: (rect.left + rect.right) / 2,
                    y: (rect.top + rect.bottom) / 2 + scrollY,
                    r: (rect.width / 2) * look.atomSize,
                };
            } else {
                target = { x: W * 0.7, y: H * 0.35, r: Math.min(W, H) * 0.17 * look.atomSize };
            }
            const viewportKey = `${W}|${H}`;
            if (viewportKey === builtFor) return undefined;
            builtFor = viewportKey;
            buildR = target.r;
            frame = { ...target };
            lastFrameX = frame.x;
            lastFrameY = frame.y;
            hasCameraPosition = false;
            return buildR;
        },

        /** Moves the camera for this frame and returns its distance and smoothed speed. */
        update(dt: number) {
            if (!frame) return { distance: D, cameraSpeed };
            // A smaller anchor pulls the camera back instead of rebuilding the streamlines; `thick` keeps the lines' screen width.
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
            if (!isStill) orbitAngle -= dt * look.orbit;
            const yawAngle = MathUtils.degToRad(
                -80 * scroll * look.lookAround +
                    yawSmooth +
                    orbitAngle +
                    pointerX * 6 * look.parallax,
            );
            const pitch = MathUtils.degToRad(
                (4 + 34 * scroll) * look.lookAround - pointerY * 4 * look.parallax,
            );
            const distance = D * (1 + 0.55 * scroll * look.lookAround) * (buildR / frame.r);
            S.thick.value = buildR / frame.r;
            camera.position
                .set(
                    Math.sin(yawAngle) * Math.cos(pitch),
                    Math.sin(pitch),
                    Math.cos(yawAngle) * Math.cos(pitch),
                )
                .multiplyScalar(distance);
            if (!hasCameraPosition) camPrevious.copy(camera.position);
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
            camera.lookAt(0, 0, 0);
            camera.setViewOffset(W, H, W / 2 - frame.x, H / 2 - frame.y, W, H);
            camera.updateMatrixWorld();
            S.focus.value = distance;
            S.fogStart.value = distance * 0.9;
            S.camR.value.setFromMatrixColumn(camera.matrixWorld, 0);
            S.camU.value.setFromMatrixColumn(camera.matrixWorld, 1);
            if (!isStill) hasCameraPosition = true;
            return { distance, cameraSpeed };
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
