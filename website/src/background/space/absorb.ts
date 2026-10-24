import { MathUtils, Vector3, type PerspectiveCamera } from "three/webgpu";
import { createThinning } from "./crossing.ts";
import type { Emit } from "./landmark.ts";

/**
 * Sends a landmark's `absorb` events, panned by where the point shows on screen. Each landmark
 * makes its own, so the thinning of its crossings stays its own.
 */
export function createAbsorber(emit: Emit, camera: PerspectiveCamera) {
    const projected = new Vector3();
    const thinning = createThinning();

    function send(point: Vector3, hue: number, strength: number) {
        projected.copy(point).project(camera);
        emit({ type: "absorb", hue, pan: MathUtils.clamp(projected.x, -1, 1), strength });
    }

    return {
        /** A line the camera passes: it sounds wherever the landmark is in the shot. */
        send,
        /**
         * A crossing of the landmark's own (a pulse, a comet, a beam pass): it sounds only while the
         * landmark is in the shot, scaled by its `presence`, and passes `share` of the time.
         */
        sendCrossing(
            point: Vector3,
            hue: number,
            strength: number,
            presence: number,
            share: number,
        ) {
            if (presence <= 0 || !thinning(share)) return;
            send(point, hue, strength * presence);
        },
    };
}
