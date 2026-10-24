import { MathUtils, Vector3, type PerspectiveCamera } from "three/webgpu";
import { flowUp } from "#/background/landmarks/black-hole/field.ts";
import type { Look } from "./look.ts";
import type { Emit, SpaceUniforms } from "./landmark.ts";

/** Camera speed (view distances per second) above which the camera counts as moving. */
const MOVING_SPEED = 0.12;
const SETTLED_SPEED = 0.08;
/** Frames a cut waits for the new page's anchor once the old page's anchor is gone. */
const CUT_FRAMES = 2;
/** Frames a cut waits at most, while the new route is still loading. */
const CUT_LIMIT = 90;
/** Seconds a flight from one shot to the next takes. */
const FLIGHT_SECONDS = 1.8;
/** How far a flight's arc lifts off the field, as a share of the distance it covers. */
const FLIGHT_LIFT = 0.35;
/** Line width factor at most; further out, as on the wide shot, lines thin on screen. */
const MAX_THICK = 2.2;

interface Frame {
    x: number;
    y: number;
    /** Screen radius in pixels of the landmark's `radius`. */
    r: number;
}

/** A point the camera looks at and the world radius around it a shot frames. */
export interface Target {
    readonly position: Vector3;
    readonly radius: number;
}

/** What the camera frames: a target, placed on screen by the page's anchor or by a fixed framing. */
export interface Shot {
    target: Target;
    anchor?: {
        /** Selector for the anchor elements this shot reads. */
        selector: string;
        /** Screen radius of the target's `radius` for an anchor of this size. */
        radius(rect: DOMRect): number;
    };
    /** Framing in viewport pixels for a page without the anchor. */
    fallback(W: number, H: number): Frame;
    /** Degrees the idle orbit sways either side of face-on; without it the camera circles. */
    sway?: number;
}

interface View {
    /** The point the camera looks at. */
    position: Vector3;
    radius: number;
    frame: Frame;
    /** Idle orbit or sway in degrees. */
    idle: number;
}

interface Flight {
    from: View;
    elapsed: number;
    /** The camera's offset off its orbit when the flight began, from a flight it interrupted. */
    startOffset: Vector3;
    /** The arc's peak lift off the field, direction and size fixed when the flight begins. */
    lift: Vector3;
}

/**
 * The camera's offset off its orbit at eased progress `e`: the offset the flight began with fades
 * out while the arc's lift rises and falls, so a flight that interrupts another starts where the
 * camera is.
 */
export function flightOffset(startOffset: Vector3, lift: Vector3, e: number, out: Vector3) {
    return out
        .copy(startOffset)
        .multiplyScalar(1 - e)
        .addScaledVector(lift, Math.sin(Math.PI * e));
}

function easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** `degrees` folded into -180..180, so a flight turns the short way. */
function foldDegrees(degrees: number): number {
    return MathUtils.euclideanModulo(degrees + 180, 360) - 180;
}

export interface CutWait {
    /** The shot differs from the one the camera frames. */
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
 * Whether a measure frames its shot now. A change of shot waits for the new page's anchor while
 * the old page still shows, then a frame or two more, so a page without the anchor falls back at
 * once and a page whose route is loading doesn't land on the fallback framing.
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
 * Places the camera around the shot's target: the page's anchor sets where it sits on screen and
 * how large, scrolling looks around, the pointer adds parallax and a sideways swipe turns the view.
 * A change of shot flies there in an arc over the field, or cuts on a still background.
 */
export function createCameraRig({ camera, uniforms: S, look, isStill, emit, signal }: RigOptions) {
    const html = document.documentElement;
    let W = 0;
    let H = 0;
    let D = 1000;
    let pageHeight = 0;
    let shot: Shot | undefined;
    /** The shot the framing was last measured for; trails `shot` while it waits for its anchor. */
    let framed: Shot | undefined;
    let target: Frame = { x: 0, y: 0, r: 100 };
    let view: View | undefined;
    let flight: Flight | undefined;
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
    const direction = new Vector3();
    /** The camera's current offset off its orbit around the view, from a flight's arc. */
    const offset = new Vector3();
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
            return view !== undefined;
        },
        resize(width: number, height: number) {
            W = width;
            H = height;
            camera.aspect = W / H;
            D = H / 2 / Math.tan(MathUtils.degToRad(camera.fov / 2));
            camera.updateProjectionMatrix();
        },

        /** The target of the shot asked for last. */
        get target(): Target | undefined {
            return shot?.target;
        },

        get isCutPending() {
            return framed !== undefined && framed !== shot;
        },

        /** Frames `next`: flies there when `fly` is set and the camera has a view, cuts otherwise. */
        setShot(next: Shot, fly: boolean) {
            if (next === shot) return;
            waited = settled = 0;
            if (view && fly) {
                const from: View = {
                    position: view.position.clone(),
                    radius: view.radius,
                    frame: { ...view.frame },
                    idle: foldDegrees(view.idle),
                };
                // The arc lifts toward the side of the field the camera is on.
                const side = Math.sign(direction.dot(flowUp)) || 1;
                flight = {
                    from,
                    elapsed: 0,
                    startOffset: offset.clone(),
                    lift: flowUp
                        .clone()
                        .multiplyScalar(
                            side * FLIGHT_LIFT * from.position.distanceTo(next.target.position),
                        ),
                };
                // The new shot's idle motion starts at rest, as on a direct load of its page.
                orbitAngle = swayPhase = 0;
            }
            shot = next;
        },

        /** Snaps the framing at the next measure and counts the next frame as a cut. */
        reset() {
            needsSnap = true;
            flight = undefined;
            offset.set(0, 0, 0);
        },

        /** Reads the shot's anchor and sets where the landmark sits on screen and how large. */
        measure() {
            if (!shot) return;
            const scrollY = window.scrollY;
            pageHeight = html.scrollHeight;
            const anchor = shot.anchor ? document.querySelector(shot.anchor.selector) : null;
            const isCutting = framed !== undefined && framed !== shot;
            const oldAnchor = isCutting ? framed?.anchor?.selector : undefined;
            const hasOldAnchor =
                oldAnchor !== undefined && document.querySelector(oldAnchor) !== null;
            const wait = { isCutting, hasAnchor: anchor !== null, hasOldAnchor, waited, settled };
            if (!shouldFrame(wait)) {
                waited += 1;
                if (!hasOldAnchor) settled += 1;
                return;
            }
            if (anchor && shot.anchor) {
                const rect = anchor.getBoundingClientRect();
                target = {
                    x: (rect.left + rect.right) / 2,
                    y: (rect.top + rect.bottom) / 2 + scrollY,
                    r: shot.anchor.radius(rect),
                };
            } else {
                target = shot.fallback(W, H);
            }
            if (!view || needsSnap || (isCutting && !flight)) {
                // A cut opens on the target's resting view, as a direct load of the page does.
                if (isCutting) orbitAngle = swayPhase = 0;
                view = {
                    position: shot.target.position.clone(),
                    radius: shot.target.radius,
                    frame: { ...target },
                    idle: 0,
                };
                lastFrameX = target.x;
                lastFrameY = target.y;
                needsSnap = false;
                isCut = true;
            }
            framed = shot;
        },

        /** Moves the camera for this frame; returns its distance from the target, smoothed speed and whether it cut. */
        update(dt: number) {
            if (!view || !shot) return { viewDistance: D, cameraSpeed, cut: true };
            const { sway } = shot;
            if (!isStill) {
                orbitAngle -= dt * look.orbit;
                if (sway) swayPhase += (dt * look.orbit) / sway;
            }
            const idle = sway ? sway * Math.sin(swayPhase) : orbitAngle;
            const frame = view.frame;
            if (flight) {
                // The flight holds while the new page's anchor is awaited, so it doesn't fly at a stale framing.
                if (framed === shot) flight.elapsed += dt;
                const progress = Math.min(1, flight.elapsed / FLIGHT_SECONDS);
                const e = easeInOut(progress);
                const { from } = flight;
                view.position.lerpVectors(from.position, shot.target.position, e);
                view.radius = from.radius * Math.pow(shot.target.radius / from.radius, e);
                frame.x = MathUtils.lerp(from.frame.x, target.x, e);
                frame.y = MathUtils.lerp(from.frame.y, target.y, e);
                frame.r = from.frame.r * Math.pow(target.r / from.frame.r, e);
                view.idle = MathUtils.lerp(from.idle, idle, e);
                flightOffset(flight.startOffset, flight.lift, e, offset);
                if (progress >= 1) {
                    flight = undefined;
                    offset.set(0, 0, 0);
                }
            } else {
                // A smaller anchor pulls the camera back instead of rebuilding; `thick` keeps the lines' screen width.
                const ease = isStill ? 1 : 1 - Math.exp(-dt * 2.2);
                view.position.copy(shot.target.position);
                view.radius = shot.target.radius;
                frame.x += (target.x - frame.x) * ease;
                frame.y += (target.y - frame.y) * ease;
                frame.r += (target.r - frame.r) * ease;
                view.idle = idle;
            }
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
            const yawAngle = MathUtils.degToRad(
                -80 * scroll * look.lookAround +
                    yawSmooth +
                    view.idle +
                    pointerX * 6 * look.parallax,
            );
            const pitch = MathUtils.degToRad(
                (4 + 34 * scroll) * look.lookAround - pointerY * 4 * look.parallax,
            );
            const zoom = view.radius / frame.r;
            const distance = D * (1 + 0.55 * scroll * look.lookAround) * zoom;
            S.thick.value = Math.min(zoom, MAX_THICK);
            S.zoom.value = zoom;
            direction.set(
                Math.sin(yawAngle) * Math.cos(pitch),
                Math.sin(pitch),
                Math.cos(yawAngle) * Math.cos(pitch),
            );
            camera.position.copy(direction).multiplyScalar(distance).add(view.position).add(offset);
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
            camera.lookAt(view.position);
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
