import { Vector3 } from "three/webgpu";
import type { Frame } from "./camera-rig.ts";

/** Share of the wide target the focus drift moves toward the focused landmark. */
const FOCUS_DRIFT = 1 / 3;
/** Viewport width above which the wide shot sits right of and below the centre, clear of the text column. */
const WIDE_BIAS_FROM = 720;
/** The wide shot's centre on wide layouts, as shares of the viewport. */
const WIDE_BIAS_X = 0.63;
const WIDE_BIAS_Y = 0.57;

interface Placed {
    readonly position: Vector3;
    readonly extent: number;
}

/**
 * The wide shot's target: the centroid of `landmarks`, drifted toward `focus` when one is given,
 * and the radius that holds every landmark's extent around the centroid.
 */
export function wideTarget(landmarks: readonly Placed[], focus?: Vector3) {
    const centroid = new Vector3();
    landmarks.forEach((landmark) => centroid.add(landmark.position));
    centroid.divideScalar(Math.max(1, landmarks.length));
    const radius = Math.max(
        ...landmarks.map((landmark) => landmark.position.distanceTo(centroid) + landmark.extent),
    );
    const position = focus ? centroid.clone().lerp(focus, FOCUS_DRIFT) : centroid;
    return { position, radius };
}

/**
 * The wide shot's framing in a `width` × `height` viewport, filling `fill` of the smaller side:
 * centred on narrow layouts, right of and below the centre on wide ones.
 */
export function wideFrame(width: number, height: number, fill: number): Frame {
    if (width <= WIDE_BIAS_FROM) {
        return { x: width / 2, y: height / 2, r: Math.min(width, height) * fill };
    }
    const x = width * WIDE_BIAS_X;
    const y = height * WIDE_BIAS_Y;
    // The largest circle around the biased centre that stays in the viewport, scaled like the centred fill.
    const room = Math.min(width - x, height - y);
    return { x, y, r: room * (fill / 0.5) };
}
