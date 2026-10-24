import {
    BufferAttribute,
    BufferGeometry,
    InterleavedBuffer,
    InterleavedBufferAttribute,
    Vector3,
} from "three/webgpu";

const TAU = Math.PI * 2;
/** Vertices around each tube. */
const RADIAL = 6;
/** Floats per vertex: center xyz, normal xyz, dat (arc length, radius, offset, gap), ext (hue, flag, length, id). */
const STRIDE = 14;

export interface Tube {
    points: Vector3[];
    /** Tube radius at each point. */
    widths: number[];
    /** `dat.z`, read by the landmark's shader. */
    offset: number;
    /** `dat.w`, read by the landmark's shader. */
    gap: number;
    hue: number;
    /** `ext.y`, a per-tube value for the shader. */
    flag: number;
    /** `ext.w`, so a shader can pick this tube. */
    id: number;
}

export interface Tubes {
    vertices: Float32Array;
    indices: Uint32Array;
    /** Index count up to the end of each tube, starting with 0. */
    tubeEnds: number[];
    /** Arc length at each point of each tube. */
    arcs: Float32Array[];
}

/** Builds tube vertices around polylines in the shared `STRIDE` layout. */
export function buildTubes(tubes: Tube[]): Tubes {
    let vertexCount = 0;
    let indexCount = 0;
    tubes.forEach(({ points }) => {
        vertexCount += points.length * RADIAL;
        indexCount += (points.length - 1) * RADIAL * 6;
    });
    const vertices = new Float32Array(vertexCount * STRIDE);
    const indices = new Uint32Array(indexCount);
    const tangent = new Vector3();
    const normal = new Vector3();
    const binormal = new Vector3();
    const radial = new Vector3();
    const up = new Vector3(0, 1, 0);
    const right = new Vector3(1, 0, 0);
    const tubeEnds = [0];
    const arcs: Float32Array[] = [];
    let vo = 0;
    let io = 0;

    tubes.forEach(({ points, widths, offset, gap, hue, flag, id }) => {
        const n = points.length;
        const base = vo / STRIDE;
        const arc = new Float32Array(n);
        let s = 0;
        for (let k = 1; k < n; k++) {
            s += points[k].distanceTo(points[k - 1]);
            arc[k] = s;
        }
        normal.set(0, 0, 0);
        for (let k = 0; k < n; k++) {
            tangent
                .subVectors(points[Math.min(n - 1, k + 1)], points[Math.max(0, k - 1)])
                .normalize();
            if (k === 0)
                normal.crossVectors(tangent, Math.abs(tangent.y) < 0.9 ? up : right).normalize();
            else normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
            binormal.crossVectors(tangent, normal);
            const radius = widths[k];
            for (let j = 0; j < RADIAL; j++) {
                const a = (j / RADIAL) * TAU;
                radial
                    .copy(normal)
                    .multiplyScalar(Math.cos(a))
                    .addScaledVector(binormal, Math.sin(a));
                const point = points[k];
                vertices[vo] = point.x;
                vertices[vo + 1] = point.y;
                vertices[vo + 2] = point.z;
                vertices[vo + 3] = radial.x;
                vertices[vo + 4] = radial.y;
                vertices[vo + 5] = radial.z;
                vertices[vo + 6] = arc[k];
                vertices[vo + 7] = radius;
                vertices[vo + 8] = offset;
                vertices[vo + 9] = gap;
                vertices[vo + 10] = hue;
                vertices[vo + 11] = flag;
                vertices[vo + 12] = s;
                vertices[vo + 13] = id;
                vo += STRIDE;
            }
        }
        for (let k = 0; k < n - 1; k++) {
            for (let j = 0; j < RADIAL; j++) {
                const a = base + k * RADIAL + j;
                const b = base + k * RADIAL + ((j + 1) % RADIAL);
                indices[io] = a;
                indices[io + 1] = a + RADIAL;
                indices[io + 2] = b;
                indices[io + 3] = b;
                indices[io + 4] = a + RADIAL;
                indices[io + 5] = b + RADIAL;
                io += 6;
            }
        }
        tubeEnds.push(io);
        arcs.push(arc);
    });

    return { vertices, indices, tubeEnds, arcs };
}

/** Geometry with the `center`, `nrm`, `dat` and `ext` attributes a tube material reads. */
export function tubeGeometry({ vertices, indices }: Tubes): BufferGeometry {
    const buffer = new InterleavedBuffer(vertices, STRIDE);
    const geometry = new BufferGeometry();
    geometry.setAttribute("center", new InterleavedBufferAttribute(buffer, 3, 0));
    geometry.setAttribute("nrm", new InterleavedBufferAttribute(buffer, 3, 3));
    geometry.setAttribute("dat", new InterleavedBufferAttribute(buffer, 4, 6));
    geometry.setAttribute("ext", new InterleavedBufferAttribute(buffer, 4, 10));
    geometry.setAttribute("position", new InterleavedBufferAttribute(buffer, 3, 0));
    geometry.setIndex(new BufferAttribute(indices, 1));
    return geometry;
}
