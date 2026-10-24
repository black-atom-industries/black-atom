import { describe, expect, it } from "vitest";
import { Vector3 } from "three/webgpu";
import { wideFrame, wideTarget } from "./wide.ts";

const landmarks = [
    { position: new Vector3(0, 0, 0), extent: 10 },
    { position: new Vector3(30, 0, 0), extent: 5 },
    { position: new Vector3(0, 30, 0), extent: 5 },
];

describe("wideTarget", () => {
    it("centres on the landmarks and holds every extent", () => {
        const { position, radius } = wideTarget(landmarks);
        expect(position.toArray()).toEqual([10, 10, 0]);
        // The far landmarks sit √500 from the centroid, plus their extent.
        expect(radius).toBeCloseTo(Math.sqrt(500) + 5);
    });

    it("drifts a third of the way toward a focused landmark, at the same radius", () => {
        const focused = wideTarget(landmarks, new Vector3(30, 0, 0));
        expect(focused.position.x).toBeCloseTo(10 + 20 / 3);
        expect(focused.position.y).toBeCloseTo(10 - 10 / 3);
        expect(focused.radius).toBeCloseTo(wideTarget(landmarks).radius);
    });
});

describe("wideFrame", () => {
    it("centres on a narrow viewport", () => {
        expect(wideFrame(390, 844, 0.47)).toEqual({ x: 195, y: 422, r: 390 * 0.47 });
    });

    it("sits right of and below the centre on a wide one, inside the viewport", () => {
        const frame = wideFrame(1440, 900, 0.5);
        expect(frame.x).toBeCloseTo(1440 * 0.63);
        expect(frame.y).toBeCloseTo(900 * 0.57);
        expect(frame.y + frame.r).toBeLessThanOrEqual(900);
        expect(frame.x + frame.r).toBeLessThanOrEqual(1440);
    });
});
