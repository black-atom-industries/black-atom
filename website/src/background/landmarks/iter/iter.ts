import {
    BufferGeometry,
    Color,
    Group,
    InstancedBufferGeometry,
    InstancedInterleavedBuffer,
    Matrix4,
    Mesh,
    MeshBasicNodeMaterial,
    PlaneGeometry,
    SphereGeometry,
    TorusGeometry,
    Vector3,
} from "three/webgpu";
import {
    abs,
    attribute,
    cameraPosition,
    clamp,
    dot,
    exp,
    float,
    fract,
    instancedBufferAttribute,
    length,
    max,
    mix,
    positionWorld,
    pow,
    sin,
    smoothstep,
    uniform,
    uv,
    varying,
    vec3,
} from "three/tsl";
import { flowDir, flowSide, flowUp } from "#/background/landmarks/black-hole/field.ts";
import { rng } from "#/background/rng.ts";
import type { Landmark, LandmarkContext } from "#/background/space/landmark.ts";
import { ACCENT_SHARE, glowOutput, hueColor } from "#/background/space/shading.ts";
import { buildTubes, tubeGeometry, type Tube } from "#/background/space/tube.ts";

const TAU = Math.PI * 2;
/** Review ring radius in world radii. */
const RING = 2;
/** Faint guide rings, in ring radii. */
const GUIDES = [0.55, 1, 1.5] as const;
const NOTE_SHARE = 0.18;
const MAX_STRANDS = 90;
/** Comet tail length as a share of its strand. */
const TAIL = 0.05;
/** Palette slots the strands take: every palette colour but grey. */
const STRAND_COLORS = 6;
/** Accent arc speed in radians per second. */
const ARC_SPEED = 0.35;

function cubic(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, steps: number, out: Vector3[]) {
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        out.push(
            new Vector3()
                .addScaledVector(p0, u * u * u)
                .addScaledVector(p1, 3 * u * u * t)
                .addScaledVector(p2, 3 * u * t * t)
                .addScaledVector(p3, t * t * t),
        );
    }
}

/**
 * The iter review cycle: changes stream in from upstream, orbit the review ring in a torus band and
 * leave downstream as one braided strand, with comets along them, pulsing review notes, faint guide
 * rings and an accent arc turning around the ring.
 */
export function createIter(
    { scene, uniforms: S, colors: currentColors }: LandmarkContext,
    place: Vector3,
): Landmark {
    const position = new Vector3();
    let ringR = 200;

    /** The ring faces the camera's resting side (+z), tilted up so its depth reads while the shot sways. */
    const axis = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(1, 0, 0), -0.4);
    const across = flowDir.clone().addScaledVector(axis, -flowDir.dot(axis)).normalize();
    const around = new Vector3().crossVectors(axis, across);

    const U = {
        ring: uniform(200),
        center: uniform(new Vector3()),
        fg: uniform(new Color()),
    };

    const strandMat = new MeshBasicNodeMaterial();
    {
        const C = attribute<"vec3">("center", "vec3");
        const N = attribute<"vec3">("nrm", "vec3");
        const DA = attribute<"vec4">("dat", "vec4");
        const EX = attribute<"vec4">("ext", "vec4");
        strandMat.positionNode = C.add(N.mul(DA.y.mul(S.thick)));
        const vC = varying(C);
        const vN = varying(N);
        const vD = varying(DA);
        const vE = varying(EX);
        const s = vD.x;
        const len = vE.z;
        const head = fract(S.time.mul(vD.w).add(vD.z));
        const behind = fract(head.sub(s.div(len)));
        const comet = pow(clamp(float(1).sub(behind.div(TAIL)), 0, 1), 2.5);
        const tip = exp(behind.mul(-300));
        const toCamera = cameraPosition.sub(vC);
        const ndv = abs(dot(vN.normalize(), toCamera.normalize()));
        const depth = length(toCamera);
        const fog = exp(max(depth.sub(S.fogStart), 0).mul(-1 / 2400))
            .mul(0.8)
            .add(0.2);
        const ends = smoothstep(float(0), U.ring.mul(1.5), s).mul(
            smoothstep(float(0), U.ring.mul(2), len.sub(s)),
        );
        const lc = hueColor(vE.x, S);
        glowOutput(
            strandMat,
            mix(lc, vec3(1, 1, 1), tip.mul(0.45).mul(float(1).sub(S.light))),
            float(0.07).add(comet.mul(1.5)).add(tip.mul(1.6)).mul(pow(ndv, 0.5)).mul(fog).mul(ends),
            S.light,
            3,
        );
    }

    const noteGeometry = new InstancedBufferGeometry();
    {
        const quad = new PlaneGeometry(1, 1);
        noteGeometry.setAttribute("position", quad.attributes.position);
        noteGeometry.setAttribute("uv", quad.attributes.uv);
        noteGeometry.setIndex(quad.index);
    }
    const noteData = new Float32Array(MAX_STRANDS * 4);
    const noteBuffer = new InstancedInterleavedBuffer(noteData, 4);
    const noteMat = new MeshBasicNodeMaterial();
    const noteSize = uniform(30);
    {
        const np = instancedBufferAttribute<"vec4">(noteBuffer, "vec4", 4, 0);
        const quad = attribute<"vec3">("position", "vec3");
        noteMat.positionNode = np.xyz.add(S.camR.mul(quad.x).add(S.camU.mul(quad.y)).mul(noteSize));
        const pulse = sin(S.time.mul(1.4).add(varying(np.w)))
            .mul(0.5)
            .add(0.5);
        const d = length(uv().sub(0.5)).mul(2);
        const core = smoothstep(float(0.2), float(0.12), d);
        const halo = exp(d.mul(d).mul(-14)).mul(0.35);
        const ringAt = pulse.mul(0.36).add(0.5);
        const wave = exp(pow(d.sub(ringAt).div(0.05), 2).negate())
            .mul(pulse)
            .mul(0.5);
        glowOutput(
            noteMat,
            mix(S.acc[0].rgb, vec3(1, 1, 1), core.mul(0.3).mul(float(1).sub(S.light))),
            core.mul(pulse.mul(0.6).add(0.9)).add(halo.mul(pulse)).add(wave),
            S.light,
        );
    }
    const notes = new Mesh(noteGeometry, noteMat);
    notes.renderOrder = 4;
    scene.add(notes);

    const ringGroup = new Group();
    ringGroup.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(across, around, axis));
    scene.add(ringGroup);

    const guideMat = new MeshBasicNodeMaterial();
    glowOutput(
        guideMat,
        U.fg.rgb,
        float(0.2).sub(length(positionWorld.sub(U.center)).div(U.ring).mul(0.06)),
        S.light,
    );
    const guides = GUIDES.map(() => {
        const mesh = new Mesh(new BufferGeometry(), guideMat);
        mesh.renderOrder = 2;
        ringGroup.add(mesh);
        return mesh;
    });

    const arcMat = new MeshBasicNodeMaterial();
    glowOutput(arcMat, S.acc[0].rgb, sin(S.time.mul(2.1)).mul(0.15).add(1.45), S.light);
    const arcGroup = new Group();
    ringGroup.add(arcGroup);
    const arc = new Mesh(new BufferGeometry(), arcMat);
    arc.renderOrder = 4;
    arcGroup.add(arc);
    const arcDot = new Mesh(new SphereGeometry(1, 16, 12), arcMat);
    arcDot.renderOrder = 4;
    arcGroup.add(arcDot);

    let strandGeometry = new BufferGeometry();
    const strands = new Mesh(strandGeometry, strandMat);
    strands.renderOrder = 2;
    scene.add(strands);

    function build(R: number, isSmall: boolean) {
        position.copy(place).multiplyScalar(R);
        ringR = RING * R;
        U.ring.value = ringR;
        U.center.value.copy(position);
        ringGroup.position.copy(position);

        const random = rng(7);
        const count = isSmall ? 40 : MAX_STRANDS;
        const ringPoint = new Vector3();
        const tangent = new Vector3();
        const tubes: Tube[] = [];
        const notePoints: { point: Vector3; phase: number }[] = [];

        for (let i = 0; i < count; i++) {
            const r = ringR * (0.82 + random() * 0.42);
            const depth = (random() - 0.5) * 0.5 * ringR;
            const wobble = random() * 0.14 * ringR;
            const waves = 2 + Math.floor(random() * 3);
            const wavePhase = random() * TAU;
            const a0 = Math.PI + (random() - 0.5) * 1.3;
            const sweep = TAU * (0.55 + random() * 0.75);
            const onRing = (a: number, out: Vector3) =>
                out
                    .copy(position)
                    .addScaledVector(across, Math.cos(a) * r)
                    .addScaledVector(around, Math.sin(a) * r)
                    .addScaledVector(axis, depth + wobble * Math.sin(waves * a + wavePhase));
            const tangentAt = (a: number, out: Vector3) =>
                out.copy(across).multiplyScalar(-Math.sin(a)).addScaledVector(around, Math.cos(a));

            const start = position
                .clone()
                .addScaledVector(flowDir, -9 * ringR)
                .addScaledVector(flowSide, (random() - 0.5) * 8 * ringR)
                .addScaledVector(flowUp, (random() - 0.5) * 4 * ringR);
            const entry = onRing(a0, new Vector3());
            const points = [start];
            cubic(
                start,
                start.clone().addScaledVector(flowDir, 3 * ringR),
                entry.clone().addScaledVector(tangentAt(a0, tangent), -r * 0.9),
                entry,
                40,
                points,
            );
            const steps = Math.ceil(sweep * 18);
            for (let k = 1; k <= steps; k++) {
                points.push(onRing(a0 + (sweep * k) / steps, ringPoint).clone());
            }

            const ply = (i % 3) * (TAU / 3) + (random() - 0.5) * 0.3;
            const strandPhase = random() * TAU;
            const twist = TAU / (2.2 * ringR);
            const braidStart = 2.6 * ringR;
            const braidAt = (b: number) => {
                const p = ply + b * twist;
                const q = strandPhase + b * twist * 3;
                return position
                    .clone()
                    .addScaledVector(flowDir, braidStart + b)
                    .addScaledVector(
                        flowSide,
                        0.09 * ringR * Math.cos(p) + 0.025 * ringR * Math.cos(q),
                    )
                    .addScaledVector(
                        flowUp,
                        0.09 * ringR * Math.sin(p) + 0.025 * ringR * Math.sin(q),
                    );
            };
            const a1 = a0 + sweep;
            const exit = onRing(a1, new Vector3());
            const braid0 = braidAt(0);
            cubic(
                exit,
                exit.clone().addScaledVector(tangentAt(a1, tangent), r * 0.9),
                braid0.clone().addScaledVector(flowDir, -1.2 * ringR),
                braid0,
                40,
                points,
            );
            for (let k = 1; k <= 60; k++) points.push(braidAt((k / 60) * 7 * ringR));

            const width = (1.6 + Math.pow(random(), 3) * 3) * (isSmall ? 0.8 : 1);
            const colorSlot = Math.floor(random() * STRAND_COLORS);
            const offset = random();
            const speed = 0.015 + random() * 0.015;
            const hasNote = random() < NOTE_SHARE;
            const noteAt = 0.25 + random() * 0.5;
            tubes.push({
                points,
                widths: points.map(() => width),
                offset,
                gap: speed,
                hue: ACCENT_SHARE + ((1 - ACCENT_SHARE) * (colorSlot + 0.5)) / (STRAND_COLORS + 1),
                flag: hasNote ? noteAt : -1,
                id: i + 1,
            });
            if (hasNote) {
                const point = points[Math.floor(noteAt * (points.length - 1))];
                notePoints.push({ point, phase: i });
            }
        }

        const built = buildTubes(tubes);
        strandGeometry.dispose();
        strandGeometry = tubeGeometry(built);
        strandGeometry.computeBoundingSphere();
        strands.geometry = strandGeometry;
        noteGeometry.boundingSphere = strandGeometry.boundingSphere;

        notePoints.forEach(({ point, phase }, k) => {
            noteData.set([point.x, point.y, point.z, phase], k * 4);
        });
        noteBuffer.needsUpdate = true;
        noteGeometry.instanceCount = notePoints.length;
        noteSize.value = ringR * 0.1;

        guides.forEach((mesh, k) => {
            mesh.geometry.dispose();
            mesh.geometry = new TorusGeometry(GUIDES[k] * ringR, ringR * 0.008, 6, 256);
        });
        arc.geometry.dispose();
        arc.geometry = new TorusGeometry(ringR, ringR * 0.016, 10, 96, Math.PI / 2);
        arcDot.scale.setScalar(ringR * 0.04);
        arcDot.position.set(0, ringR, 0);
    }

    function update() {
        const current = currentColors();
        if (current) U.fg.value.copy(current.fg);
        arcGroup.rotation.z = S.time.value * ARC_SPEED;
    }

    return {
        position,
        get radius() {
            return ringR;
        },
        get extent() {
            return ringR * Math.max(...GUIDES);
        },
        build,
        update,
        dispose() {
            [strandMat, noteMat, guideMat, arcMat].forEach((material) => material.dispose());
            [
                strandGeometry,
                noteGeometry,
                arc.geometry,
                arcDot.geometry,
                ...guides.map((mesh) => mesh.geometry),
            ].forEach((geometry) => geometry.dispose());
        },
    };
}
