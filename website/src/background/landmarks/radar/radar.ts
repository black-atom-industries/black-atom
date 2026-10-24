import {
    BoxGeometry,
    BufferGeometry,
    CanvasTexture,
    CircleGeometry,
    Color,
    CylinderGeometry,
    DoubleSide,
    Group,
    InstancedBufferGeometry,
    InstancedInterleavedBuffer,
    InstancedMesh,
    Matrix4,
    Mesh,
    MeshBasicNodeMaterial,
    Object3D,
    PlaneGeometry,
    Sphere,
    TorusGeometry,
    Vector3,
    type Node,
} from "three/webgpu";
import {
    atan,
    attribute,
    clamp,
    exp,
    float,
    fract,
    instancedBufferAttribute,
    length,
    max,
    min,
    mix,
    positionWorld,
    pow,
    select,
    smoothstep,
    step,
    texture,
    uniform,
    uv,
    varying,
    vec2,
    vec3,
} from "three/tsl";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng } from "#/background/rng.ts";
import type { Landmark, LandmarkContext } from "#/background/space/landmark.ts";
import { glowOutput } from "#/background/space/shading.ts";

const TAU = Math.PI * 2;
/** The radar's unit, the scale its rings and blips are laid out in, in world radii. */
const UNIT = 1.4;
/** Guide rings at 0.45, 0.9 … 3.15 units. */
const RING_COUNT = 7;
const RING_STEP = 0.45;
const TICK_COUNT = 72;
const TICK_RADIUS = 1.8;
/** Beam reach in units. */
const REACH = 3.3;
/** Beam speed in radians per second. */
const SWEEP_SPEED = 0.55;
/** Angle in radians the beam's fan trails behind it. */
const FAN = 1.1;
const BLIP_COUNT = 70;
/** radar.nvim's direct keys: home-row locks, numbered recents, and `o` for the alternate file. */
const KEYS = ["a", "s", "d", "f", "g", "1", "2", "3", "4", "5", "o"] as const;
/** Colour slot per blip kind: 0 lock (accent), 1 recent (cyan), 2 alternate (magenta), 3 file. */
const KIND_LOCK = 0;
const KIND_RECENT = 1;
const KIND_ALTERNATE = 2;
const KIND_FILE = 3;
/** Pixels per glyph cell in the key atlas. */
const CELL = 64;

function kindOf(key: string | undefined): number {
    if (key === undefined) return KIND_FILE;
    if (key === "o") return KIND_ALTERNATE;
    return /[0-9]/.test(key) ? KIND_RECENT : KIND_LOCK;
}

/** White key glyphs in one row, tinted by the blip shader. */
function drawKeyAtlas(canvas: HTMLCanvasElement) {
    canvas.width = CELL * KEYS.length;
    canvas.height = CELL;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fff";
    context.font = `600 ${CELL * 0.62}px 'Kode Mono', monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    KEYS.forEach((key, i) => context.fillText(key, (i + 0.5) * CELL, CELL * 0.54));
}

/**
 * The radar.nvim sweep: a tilted disc of guide rings, crosshairs and ticks, a beam that turns, and
 * the working set as blips at different heights that light up as the beam passes; locks, recents
 * and the alternate file carry their key.
 */
export function createRadar(
    { scene, uniforms: S, colors: currentColors }: LandmarkContext,
    place: Vector3,
): Landmark {
    const position = new Vector3();
    let unit = 140;

    /** The disc faces the camera's resting side (+z), tilted up so its depth reads while the shot sways. */
    const axis = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(1, 0, 0), -0.55);
    const across = new Vector3(1, 0, 0);
    const around = new Vector3().crossVectors(axis, across);

    const U = {
        unit: uniform(140),
        center: uniform(new Vector3()),
        fg: uniform(new Color()),
    };
    const sweep = S.time.mul(SWEEP_SPEED);
    /** Radians since the beam passed angle `angle`, 0..TAU. */
    const since = (angle: Node<"float">) => fract(sweep.sub(angle).div(TAU)).mul(TAU);

    const disc = new Group();
    disc.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(across, around, axis));
    scene.add(disc);

    const ringMat = new MeshBasicNodeMaterial();
    glowOutput(
        ringMat,
        U.fg.rgb,
        float(0.34)
            .sub(length(positionWorld.sub(U.center)).div(U.unit).mul(0.075))
            .max(0.06),
        S.light,
    );
    const rings = new Mesh(new BufferGeometry(), ringMat);
    rings.renderOrder = 2;
    disc.add(rings);
    const ticks = new Mesh(new BufferGeometry(), ringMat);
    ticks.renderOrder = 2;
    disc.add(ticks);

    const crossMat = new MeshBasicNodeMaterial();
    glowOutput(
        crossMat,
        U.fg.rgb,
        float(1)
            .sub(smoothstep(float(0), U.unit.mul(REACH + 0.4), length(positionWorld.sub(U.center))))
            .mul(0.14),
        S.light,
    );
    const cross = new Mesh(new BufferGeometry(), crossMat);
    cross.renderOrder = 2;
    disc.add(cross);

    const beamMat = new MeshBasicNodeMaterial({ side: DoubleSide });
    {
        const bp = attribute<"vec3">("position", "vec3");
        const r = length(vec2(bp.x, bp.y));
        const behind = since(atan(bp.y, bp.x));
        const fan = pow(clamp(float(1).sub(behind.div(FAN)), 0, 1), 1.6).mul(0.3);
        const off = min(behind, float(TAU).sub(behind)).mul(r);
        const edge = exp(pow(off.div(U.unit.mul(0.012)), 2).negate()).mul(1.8);
        const radial = smoothstep(float(0), U.unit.mul(0.12), r).mul(
            float(1).sub(smoothstep(U.unit.mul(REACH - 0.5), U.unit.mul(REACH), r)),
        );
        glowOutput(
            beamMat,
            mix(S.acc[0].rgb, vec3(1, 1, 1), edge.mul(0.12).mul(float(1).sub(S.light))),
            fan.add(edge).mul(radial),
            S.light,
        );
    }
    const beam = new Mesh(new BufferGeometry(), beamMat);
    beam.renderOrder = 3;
    disc.add(beam);

    const stemMat = new MeshBasicNodeMaterial();
    glowOutput(stemMat, U.fg.rgb, float(0.1), S.light);
    const stemGeometry = new CylinderGeometry(1, 1, 1, 5);
    stemGeometry.rotateX(Math.PI / 2);
    stemGeometry.translate(0, 0, 0.5);
    const stems = new InstancedMesh(stemGeometry, stemMat, BLIP_COUNT);
    stems.renderOrder = 2;
    disc.add(stems);

    const atlasCanvas = document.createElement("canvas");
    drawKeyAtlas(atlasCanvas);
    const atlas = new CanvasTexture(atlasCanvas);
    void document.fonts.load(`600 ${CELL * 0.62}px 'Kode Mono'`).then(() => {
        drawKeyAtlas(atlasCanvas);
        atlas.needsUpdate = true;
    });

    const blipGeometry = new InstancedBufferGeometry();
    {
        const quad = new PlaneGeometry(1, 1);
        blipGeometry.setAttribute("position", quad.attributes.position);
        blipGeometry.setAttribute("uv", quad.attributes.uv);
        blipGeometry.setIndex(quad.index);
    }
    blipGeometry.instanceCount = BLIP_COUNT;
    /** Per blip: world position and angle on the disc; kind, glyph (-1 for none), half-size, unused. */
    const blipData = new Float32Array(BLIP_COUNT * 8);
    const blipBuffer = new InstancedInterleavedBuffer(blipData, 8);
    const blipMat = new MeshBasicNodeMaterial();
    {
        const bp = instancedBufferAttribute<"vec4">(blipBuffer, "vec4", 8, 0);
        const bk = instancedBufferAttribute<"vec4">(blipBuffer, "vec4", 8, 4);
        const quad = attribute<"vec3">("position", "vec3");
        blipMat.positionNode = bp.xyz.add(
            S.camR.mul(quad.x).add(S.camU.mul(quad.y)).mul(bk.z.mul(2)),
        );
        const vAngle = varying(bp.w);
        const vk = varying(bk);
        const glow = exp(since(vAngle).mul(-1.1));
        const d = length(uv().sub(0.5)).mul(2);
        const ring = exp(pow(d.sub(0.24).div(0.035), 2).negate()).mul(glow.mul(0.65).add(0.35));
        const pingAt = float(1).sub(glow).mul(0.66).add(0.24);
        const ping = exp(pow(d.sub(pingAt).div(0.03), 2).negate())
            .mul(glow)
            .mul(0.5);
        const cellUv = uv().sub(0.5).div(0.34).add(0.5);
        const inside = step(float(0), cellUv.x)
            .mul(step(cellUv.x, float(1)))
            .mul(step(float(0), cellUv.y))
            .mul(step(cellUv.y, float(1)));
        const glyph = texture(
            atlas,
            vec2(clamp(cellUv.x, 0, 1).add(max(vk.y, 0)).div(KEYS.length), clamp(cellUv.y, 0, 1)),
        ).a.mul(inside);
        const keyI = ring
            .mul(1.5)
            .add(ping)
            .add(glyph.mul(glow.mul(0.8).add(0.9)))
            .add(exp(d.mul(d).mul(-18)).mul(glow).mul(0.35));
        const fileI = smoothstep(float(0.4), float(0.22), d)
            .mul(glow.mul(1.1).add(0.3))
            .add(exp(d.mul(d).mul(-6)).mul(glow).mul(0.5));
        const kindColor = select(
            vk.x.lessThan(0.5),
            S.acc[0].rgb,
            select(
                vk.x.lessThan(1.5),
                S.pal[3].rgb,
                select(vk.x.lessThan(2.5), S.pal[5].rgb, U.fg.rgb),
            ),
        );
        glowOutput(
            blipMat,
            mix(kindColor, vec3(1, 1, 1), glyph.mul(0.2).mul(float(1).sub(S.light))),
            select(vk.y.lessThan(-0.5), fileI, keyI),
            S.light,
        );
    }
    const blips = new Mesh(blipGeometry, blipMat);
    blips.renderOrder = 4;
    scene.add(blips);

    function build(R: number) {
        position.copy(place).multiplyScalar(R);
        unit = UNIT * R;
        U.unit.value = unit;
        U.center.value.copy(position);
        disc.position.copy(position);
        disc.updateMatrixWorld(true);

        rings.geometry.dispose();
        rings.geometry =
            mergeGeometries(
                Array.from(
                    { length: RING_COUNT },
                    (_, k) => new TorusGeometry(RING_STEP * (k + 1) * unit, unit * 0.008, 6, 256),
                ),
            ) ?? new BufferGeometry();

        const tickShapes = Array.from({ length: TICK_COUNT }, (_, m) => {
            const angle = (m / TICK_COUNT) * TAU;
            const tickLength = unit * (m % 6 === 0 ? 0.16 : 0.07);
            const box = new BoxGeometry(tickLength, unit * 0.012, unit * 0.012);
            box.translate(TICK_RADIUS * unit + tickLength / 2, 0, 0);
            box.rotateZ(angle);
            return box;
        });
        ticks.geometry.dispose();
        ticks.geometry = mergeGeometries(tickShapes) ?? new BufferGeometry();

        const reach = (REACH + 0.3) * unit;
        const horizontal = new BoxGeometry(reach * 2, unit * 0.006, unit * 0.006);
        const vertical = new BoxGeometry(unit * 0.006, reach * 2, unit * 0.006);
        cross.geometry.dispose();
        cross.geometry = mergeGeometries([horizontal, vertical]) ?? new BufferGeometry();

        beam.geometry.dispose();
        beam.geometry = new CircleGeometry(REACH * unit, 192);

        const random = rng(11);
        const local = new Vector3();
        const world = new Vector3();
        const stem = new Object3D();
        for (let i = 0; i < BLIP_COUNT; i++) {
            const key: string | undefined = KEYS[i];
            const angle = random() * TAU;
            const radius = key
                ? unit * (key === "o" ? 0.28 : 0.45 + random() * 0.95)
                : unit * (0.2 + random() * 2.6);
            const height = (random() - 0.35) * unit * (key ? 0.5 : 0.9);
            local.set(Math.cos(angle) * radius, Math.sin(angle) * radius, height);
            world.copy(local).applyMatrix4(disc.matrixWorld);
            blipData.set(
                [
                    world.x,
                    world.y,
                    world.z,
                    angle,
                    kindOf(key),
                    key === undefined ? -1 : i,
                    unit * (key ? 0.3 : 0.06),
                    0,
                ],
                i * 8,
            );
            stem.position.set(local.x, local.y, 0);
            stem.scale.set(unit * 0.004, unit * 0.004, height === 0 ? 1e-3 : height);
            stem.updateMatrix();
            stems.setMatrixAt(i, stem.matrix);
        }
        blipBuffer.needsUpdate = true;
        stems.instanceMatrix.needsUpdate = true;
        stems.computeBoundingSphere();
        blipGeometry.boundingSphere = new Sphere(position.clone(), unit * (REACH + 0.5));
    }

    return {
        position,
        get radius() {
            return unit;
        },
        build,
        update() {
            const current = currentColors();
            if (current) U.fg.value.copy(current.fg);
        },
        dispose() {
            [ringMat, crossMat, beamMat, stemMat, blipMat].forEach((material) =>
                material.dispose(),
            );
            [
                rings.geometry,
                ticks.geometry,
                cross.geometry,
                beam.geometry,
                stemGeometry,
                blipGeometry,
            ].forEach((geometry) => geometry.dispose());
            stems.dispose();
            atlas.dispose();
        },
    };
}
