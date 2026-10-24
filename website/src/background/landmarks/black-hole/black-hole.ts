import {
    BufferGeometry,
    Color,
    CustomBlending,
    DoubleSide,
    Group,
    InstancedBufferGeometry,
    InstancedInterleavedBuffer,
    MathUtils,
    Matrix4,
    Mesh,
    MeshBasicNodeMaterial,
    OneFactor,
    OneMinusSrcAlphaFactor,
    PlaneGeometry,
    SphereGeometry,
    TorusGeometry,
    Vector2,
    Vector3,
    Vector4,
    type Node,
} from "three/webgpu";
import {
    abs,
    atan,
    attribute,
    cameraPosition,
    clamp,
    cos,
    dot,
    exp,
    float,
    fract,
    fwidth,
    instancedBufferAttribute,
    length,
    max,
    mix,
    normalWorld,
    positionWorld,
    pow,
    screenUV,
    select,
    sin,
    smoothstep,
    uniform,
    uv,
    varying,
    vec2,
    vec3,
    vec4,
} from "three/tsl";
import { rng } from "#/background/rng.ts";
import type {
    Landmark,
    LandmarkContext,
    LandmarkFrame,
    SceneColorNode,
} from "#/background/space/landmark.ts";
import { ACCENT_SHARE, accentAt, glowOutput, hueColor } from "#/background/space/shading.ts";
import { tubeGeometry as createTubeGeometry } from "#/background/space/tube.ts";
import type { SingNote } from "#/background/types.ts";
import { buildStreamlines, flowDir, flowSide, flowUp, type Line } from "./field.ts";

const TAU = Math.PI * 2;
/** Pulse speed along the lines, world units per second. */
const PULSE_SPEED = 90;
const FLASH_COUNT = 48;
const PARTICLE_COUNT = 3600;
const HALO_SCALE = 3.2;
const VOID_PATCHES = [
    [-2000, 1300, 1150],
    [2300, -1500, 1300],
    [-600, -2900, 1000],
    [3400, 1700, 1200],
] as const;

/**
 * The black hole: lines flow past and into a hole whose place and size come from the page's hole
 * anchor, with its accretion disk, particles and the flashes of absorbed lines.
 */
export function createBlackHole({
    scene,
    camera,
    uniforms: S,
    look,
    isStill,
    emit,
    colors: currentColors,
}: LandmarkContext): Landmark {
    let isSmall = innerWidth < 700;

    const U = {
        R: uniform(100),
        phase: uniform(0),
        time: S.time,
        rim: uniform(new Color()),
        core: uniform(new Color()),
        light: S.light,
        fogStart: S.fogStart,
        fogK: uniform(1 / 2400),
        energy: uniform(0),
        /** Where the near-camera fade of the lines ends, in world units from the camera. */
        nearEnd: uniform(900),
        /** Line intensity factor, below 1 while another landmark is active. */
        recede: uniform(1),
        lineSat: uniform(1),
        lineGlow: uniform(1),
        pulseShape: uniform(2.5),
        wind: uniform(1),
        breath: uniform(0),
        ringBlur: uniform(0.6),
        ringM: uniform(new Matrix4()),
        haloC: uniform(new Color()),
        ringGlow: uniform(1),
        depth: uniform(0.85),
        absorb: uniform(0.6),
        focus: S.focus,
        focusIn: uniform(260),
        focusR: uniform(900),
        blur: uniform(0.6),
        nAcc: S.nAcc,
        camR: S.camR,
        camU: S.camU,
        thick: S.thick,
        singGlow: uniform(look.singGlow),
        singDecay: uniform(look.singDecay),
    };
    const VOIDS = VOID_PATCHES.map(() => uniform(new Vector4(1e6, 0, 0, 1)));
    const uRB = uniform(1.78);
    const uRW = uniform(0.66);
    const uRingMi = uniform(new Matrix4());
    const uDiskTh = uniform(1);
    const uDiskPull = uniform(0.35);
    const uDiskGlow = uniform(1.2);
    /** Camera impacts: a = (hue, start, amplitude, -), p = point, v = (direction, wave number). */
    const SHAKES = Array.from({ length: 8 }, () => ({
        a: uniform(new Vector4(-1, -100, 0, 0)),
        p: uniform(new Vector3()),
        v: uniform(new Vector4(0, 1, 0, 0.01)),
    }));
    let shakeIndex = 0;
    /** Singing lines: x = line id, y = start, z = end (scene time), w = amplitude. */
    const SINGERS = Array.from({ length: 10 }, () => ({
        id: uniform(-1),
        start: uniform(-100),
        end: uniform(-100),
        amp: uniform(0),
    }));

    const tubeMat = new MeshBasicNodeMaterial();
    {
        const C = attribute<"vec3">("center", "vec3");
        const N = attribute<"vec3">("nrm", "vec3");
        const DA = attribute<"vec4">("dat", "vec4");
        const EX = attribute<"vec4">("ext", "vec4");
        const rl = uRingMi.mul(vec4(C, 1)).xyz;
        const rrad = max(length(vec2(rl.x, rl.y)), 1e-3);
        const dHz = uDiskTh.mul(0.05).add(0.12).mul(uRW.div(0.66).mul(0.5).add(0.5));
        const dBand = smoothstep(uRB.sub(uRW).sub(0.3), uRB.sub(uRW).add(0.15), rrad).mul(
            float(1).sub(smoothstep(uRB.add(uRW).sub(0.2), uRB.add(uRW).add(0.5), rrad)),
        );
        const dZ = rl.z.div(dHz);
        const dW = exp(dZ.mul(dZ).negate()).mul(dBand);
        const dAng = atan(rl.y, rl.x);
        const dTan = U.ringM.mul(vec4(vec3(rl.y.negate(), rl.x, 0).div(rrad), 0)).xyz;
        const dDrag = dTan.mul(
            dW
                .mul(uDiskPull)
                .mul(
                    sin(dAng.mul(3).sub(U.time.mul(0.9)))
                        .mul(0.3)
                        .add(0.7),
                )
                .mul(pow(rrad, -0.5)),
        );
        const camD = length(cameraPosition.sub(C));
        const coc = clamp(abs(camD.sub(U.focus)).sub(U.focusIn).div(U.focusR), 0, 1)
            .mul(U.blur)
            .mul(U.light.mul(-0.55).add(1));
        let shake: Node<"vec3"> = vec3(0, 0, 0);
        SHAKES.forEach((S) => {
            const dS = max(U.time.sub(S.a.y), 0);
            const same = float(1).sub(smoothstep(float(0), float(1e-5), abs(EX.x.sub(S.a.x))));
            const d = length(C.sub(S.p));
            const k = S.v.w;
            const env = exp(dS.mul(-1.1))
                .mul(exp(d.mul(k).mul(-0.09)))
                .mul(smoothstep(float(0), float(1), dS.mul(30).sub(d.mul(k).mul(0.6)).add(1)));
            const wave = sin(d.mul(k).sub(dS.mul(16)))
                .mul(0.6)
                .add(sin(d.mul(k).mul(0.37).sub(dS.mul(7))).mul(0.4));
            shake = shake.add(S.v.xyz.mul(same.mul(S.a.z).mul(env).mul(wave)));
        });
        let singing: Node<"float"> = float(0);
        SINGERS.forEach((G) => {
            const same = float(1).sub(smoothstep(float(0.4), float(0.6), abs(EX.w.sub(G.id))));
            const tail = max(U.time.sub(G.end), 0).div(U.singDecay);
            singing = singing.add(
                same
                    .mul(G.amp)
                    .mul(smoothstep(G.start, G.start.add(0.25), U.time))
                    .mul(
                        select(
                            U.time.lessThan(G.end),
                            float(1),
                            exp(tail.mul(tail).mul(-2.2).sub(tail.mul(1.2))),
                        ),
                    ),
            );
        });
        const sg = clamp(singing, 0, 1.4);
        const vSg = varying(sg);
        const sgVib = sin(DA.x.mul(0.0011).sub(U.time.mul(1.4)));
        const cocS = coc.mul(float(1).sub(clamp(sg, 0, 1).mul(0.75)));
        tubeMat.positionNode = C.add(
            N.mul(
                DA.y
                    .mul(U.thick)
                    .mul(cocS.mul(3.2).add(1))
                    .mul(
                        sg
                            .mul(sgVib.mul(0.15).add(1.4))
                            .mul(clamp(camD.div(1400), 1, 5))
                            .add(1),
                    ),
            ),
        )
            .add(shake.mul(smoothstep(U.R.mul(1.3), U.R.mul(4), length(C))))
            .add(dDrag);
        const vDw = varying(dW);
        const vC = varying(C);
        const vN = varying(N);
        const vD = varying(DA);
        const vE = varying(EX);
        const vCoc = varying(cocS);
        const s = vD.x;
        const h = vE.x;
        const hit = vE.y;
        const len = vE.z;
        const lc = hueColor(h, S);

        const u = s.sub(U.phase).sub(vD.z).div(vD.w);
        const wv = cos(u.mul(TAU)).mul(0.5).add(0.5);
        const p = pow(wv, U.pulseShape);
        const dH = length(vC);
        const sat = pow(smoothstep(U.R.mul(1.2), U.R.mul(U.absorb.mul(14).add(2.5)), dH), 0.85);
        const lum = dot(lc, vec3(0.299, 0.587, 0.114));
        const grey = vec3(lum, lum, lum);
        const vivid = max(mix(grey, lc, U.lineSat.mul(U.light.mul(0.6).add(1.3))), 0).mul(
            U.light.mul(-0.22).add(1),
        );
        const drained = mix(grey.mul(0.4), vivid, sat);
        const vanish = smoothstep(U.R.mul(0.9), U.R.mul(1.6), dH);
        const n = vN.normalize();
        const diff = max(dot(n, vec3(-0.35, 0.6, 0.72).normalize()), 0);
        const toCamera = cameraPosition.sub(vC).normalize();
        const ndv = abs(dot(n, toCamera));
        const rimT = pow(float(1).sub(ndv), 2.5).mul(float(1).sub(vCoc));
        const shade = diff.mul(0.7).add(0.3).add(rimT.mul(0.45));
        const prof = pow(ndv, mix(float(0.3), float(2.2), vCoc)).div(
            vCoc.mul(mix(float(2.6), float(1.2), U.light)).add(1),
        );
        const depth = length(cameraPosition.sub(vC));
        const fog = exp(
            float(0).sub(max(depth.sub(U.fogStart), 0).mul(U.fogK.mul(U.light.mul(-0.5).add(1)))),
        )
            .mul(0.82)
            .add(mix(float(0.18), float(0.32), U.light));
        const nearF = smoothstep(float(160), U.nearEnd, depth);
        const endF = smoothstep(float(0), float(2600), s).mul(
            mix(smoothstep(float(0), float(900), len.sub(s)), float(1), hit),
        );
        let vf: Node<"float"> = float(1);
        VOIDS.forEach((v) => {
            vf = vf.mul(smoothstep(float(0.3), float(1), length(vC.sub(v.xyz)).div(v.w)));
        });
        const env = shade.mul(prof).mul(fog).mul(nearF).mul(endF).mul(vf).mul(vanish).mul(U.recede);
        const bI = mix(float(0.04), float(0.24), sat);
        const cI = p.mul(mix(float(0.5), float(2.6), sat));
        const slow = cos(
            s
                .div(vD.w.mul(2.7))
                .sub(U.phase.div(vD.w.mul(2.7)))
                .add(vD.z.mul(0.01))
                .mul(TAU),
        )
            .mul(0.5)
            .add(0.5);
        const bead = pow(wv, 4).mul(slow.mul(0.7).add(0.3));
        const near = float(1).sub(sat);
        const hI = bead
            .mul(mix(float(1.3), float(3.2), near))
            .mul(U.lineGlow)
            .mul(smoothstep(float(0.85), float(2.4), dH.div(U.R)));
        const hC = mix(vivid, vec3(1, 1, 1), near.mul(0.55).add(0.15).mul(float(1).sub(U.light)));
        const sgI2 = vSg
            .mul(
                sin(s.mul(0.0011).sub(U.time.mul(1.4)))
                    .mul(0.2)
                    .add(0.8),
            )
            .mul(U.singGlow)
            .mul(2.5)
            .mul(smoothstep(float(0.9), float(1.6), dH.div(U.R)));
        const sgF = clamp(vSg, 0, 1);
        const dGl = vDw.mul(uDiskGlow);
        const tI = bI
            .add(mix(cI, float(1.2), sgF))
            .mul(dGl.add(1))
            .add(dGl.mul(0.25));
        const hI2 = hI.mul(float(1).sub(sgF)).add(sgI2);
        const aI = tI.add(hI2);
        const singColor = mix(hC, mix(vivid.mul(1.6), vec3(1, 1, 1), 0.35), sgF);
        glowOutput(
            tubeMat,
            drained.mul(tI).add(singColor.mul(hI2)).div(aI.add(1e-4)),
            aI.mul(env).mul(vSg.mul(0.6).add(1)),
            U.light,
            4.2,
        );
    }

    const holeGroup = new Group();
    scene.add(holeGroup);
    const sphereMat = new MeshBasicNodeMaterial();
    {
        const sp0 = attribute<"vec3">("position", "vec3");
        const tt = U.time;
        const wobble = sin(sp0.x.mul(3.1).add(tt.mul(0.9)))
            .mul(sin(sp0.y.mul(3.7).sub(tt.mul(0.7))))
            .mul(sin(sp0.z.mul(2.9).add(tt.mul(1.13))))
            .mul(0.04)
            .add(sin(sp0.y.mul(9).add(sp0.x.mul(5)).add(tt.mul(2.3))).mul(0.009))
            .mul(U.energy.mul(0.6).add(1));
        sphereMat.positionNode = sp0.mul(wobble.add(sin(tt.mul(0.6)).mul(0.014)).add(1));
        const sv = cameraPosition.sub(positionWorld).normalize();
        const ndv = max(dot(normalWorld, sv), 0);
        const fres = pow(float(1).sub(ndv), 4);
        const swirl = sin(
            sp0.y
                .mul(6)
                .add(sp0.x.mul(4))
                .sub(tt.mul(1.6))
                .add(sin(sp0.z.mul(5).add(tt))),
        )
            .mul(0.5)
            .add(0.5);
        const flick = sin(tt.mul(7.3))
            .mul(sin(tt.mul(3.1)))
            .mul(0.18)
            .add(0.82);
        sphereMat.colorNode = U.core.rgb.add(
            U.rim.rgb.mul(
                fres
                    .mul(swirl.mul(0.7).add(0.3))
                    .mul(flick)
                    .mul(U.energy.mul(0.6).add(0.3))
                    .mul(float(1.15).sub(U.depth.mul(0.6)))
                    .mul(U.breath.mul(0.9).add(1)),
            ),
        );
    }
    const sphere = new Mesh(new SphereGeometry(1, 72, 54), sphereMat);
    sphere.renderOrder = 0;
    holeGroup.add(sphere);

    const haloMat = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    {
        const hd = length(uv().sub(0.5)).mul(2 * HALO_SCALE);
        const fade = float(1).sub(smoothstep(float(HALO_SCALE * 0.6), float(HALO_SCALE), hd));
        haloMat.colorNode = U.haloC;
        const hx = max(hd.sub(1), 0);
        haloMat.opacityNode = mix(
            exp(hx.mul(-4)).mul(U.depth).mul(0.4),
            exp(hx.mul(-4))
                .mul(0.45)
                .add(exp(hx.mul(-1.2)).mul(0.14)),
            U.light,
        ).mul(fade);
    }
    const halo = new Mesh(new PlaneGeometry(2 * HALO_SCALE, 2 * HALO_SCALE), haloMat);
    halo.renderOrder = 1;
    holeGroup.add(halo);

    const ringGroup = new Group();
    holeGroup.add(ringGroup);
    const ringMat = new MeshBasicNodeMaterial({ side: DoubleSide });
    const ringBodyMat = new MeshBasicNodeMaterial({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
    });
    {
        const tt = U.time;
        const rp = attribute<"vec3">("position", "vec3");
        const dr = length(vec2(rp.x, rp.y)).sub(uRB).div(uRW);
        const ru = uv()
            .x.add(tt.mul(U.wind).mul(0.03).div(dr.mul(0.35).add(1.1)))
            .add(
                sin(
                    uv()
                        .x.mul(TAU * 2)
                        .add(tt.mul(0.45))
                        .add(dr.mul(1.5)),
                )
                    .mul(0.018)
                    .mul(U.wind),
            );
        const soft = pow(clamp(float(1).sub(dr.mul(dr)), 0, 1), 1.6).mul(
            smoothstep(float(0.6), float(-0.9), dr).mul(0.8).add(0.35),
        );
        const aaU = fwidth(ru);
        const aaR = fwidth(dr);
        const aa = (fq: number, fr: number) =>
            smoothstep(float(0.5), float(0.12), aaU.mul(fq).add(aaR.mul(fr)));
        const strand0 = pow(
            sin(
                ru
                    .mul(TAU * 11)
                    .add(dr.mul(4))
                    .sub(tt.mul(1.2)),
            )
                .mul(
                    sin(
                        ru
                            .mul(TAU * 5)
                            .sub(dr.mul(7))
                            .add(tt.mul(0.7)),
                    ),
                )
                .mul(0.5)
                .add(0.5),
            4,
        );
        const strand = mix(float(0.12), strand0, aa(11, 4));
        const hl = pow(
            cos(ru.sub(tt.mul(0.07)).mul(TAU))
                .mul(0.5)
                .add(0.5),
            10,
        );
        const clump0 = pow(
            sin(ru.mul(TAU * 7).add(tt.mul(0.9)))
                .mul(sin(ru.mul(TAU * 3).sub(tt.mul(0.55))))
                .mul(sin(ru.mul(TAU * 13).add(tt.mul(1.7))))
                .mul(0.5)
                .add(0.5),
            3,
        );
        const clump = mix(float(0.14), clump0, aa(13, 0));
        const fl = sin(ru.mul(TAU * 23).sub(tt.mul(3.1)))
            .mul(aa(23, 0).mul(0.25))
            .add(0.75);
        const ringI = float(0.06)
            .add(hl.mul(0.55))
            .add(clump.mul(0.5))
            .add(strand.mul(0.45))
            .mul(fl)
            .mul(soft)
            .mul(U.energy.mul(0.6).add(1))
            .mul(U.ringGlow)
            .mul(
                sin(ru.mul(TAU * 4).sub(tt.mul(1.7)))
                    .mul(0.3)
                    .mul(U.wind)
                    .add(1),
            )
            .mul(U.breath.mul(0.35).add(1));
        const ph = fract(
            ru
                .add(dr.mul(0.04))
                .sub(tt.mul(0.035))
                .add(sin(ru.mul(TAU * 3).add(tt.mul(0.4))).mul(0.06)),
        ).mul(U.nAcc);
        const accMix = accentAt(ph, S);
        const lm = dot(accMix, vec3(0.299, 0.587, 0.114));
        const vividAcc = max(mix(vec3(lm, lm, lm), accMix, 1.35), 0);
        const hot = pow(clump.mul(0.6).add(strand.mul(0.4)), 2);
        const ringC = mix(vividAcc, vec3(1, 1, 1), hot.mul(0.22));
        const ra = clamp(ringI.mul(2.6), 0, 1);
        ringMat.colorNode = mix(ringC.mul(ringI).mul(0.9), vividAcc.mul(ra), U.light);
        ringBodyMat.colorNode = U.core;
        ringBodyMat.opacityNode = clamp(
            soft.mul(clump.mul(0.35).add(0.55)).mul(U.ringGlow),
            0,
            0.92,
        );
        ringMat.opacityNode = ra.mul(U.light);
        ringMat.transparent = true;
        ringMat.depthWrite = false;
        ringMat.blending = CustomBlending;
        ringMat.blendSrc = OneFactor;
        ringMat.blendDst = OneMinusSrcAlphaFactor;
        ringMat.blendSrcAlpha = OneFactor;
        ringMat.blendDstAlpha = OneMinusSrcAlphaFactor;
    }
    const ring = new Mesh(new TorusGeometry(1.78, 0.66, 24, 360), ringMat);
    ring.renderOrder = 4;
    ringGroup.add(ring);
    const ringBody = new Mesh(ring.geometry, ringBodyMat);
    ringBody.renderOrder = 3;
    ringGroup.add(ringBody);

    const hazeMat = new MeshBasicNodeMaterial({ side: DoubleSide });
    {
        const hp = attribute<"vec3">("position", "vec3");
        const tt = U.time;
        const hr = length(vec2(hp.x, hp.y));
        const ha = uv().x;
        const dz = hr.sub(uRB).div(uRW.mul(1.7));
        const g = exp(dz.mul(dz).mul(-6));
        const gust = sin(ha.mul(TAU * 3).sub(tt.mul(0.6).mul(U.wind)))
            .mul(0.35)
            .add(0.65);
        const hc = accentAt(fract(ha.sub(tt.mul(0.035))).mul(U.nAcc), S);
        glowOutput(
            hazeMat,
            hc,
            g
                .mul(gust)
                .mul(mix(float(0.05), float(0.025), U.light))
                .mul(U.ringBlur)
                .mul(U.ringGlow)
                .mul(U.breath.mul(0.4).add(1)),
            U.light,
        );
    }
    const haze = new Mesh(new TorusGeometry(1.78, 0.66 * 1.9, 20, 240), hazeMat);
    haze.renderOrder = 3;
    ringGroup.add(haze);
    const haze2 = new Mesh(haze.geometry, hazeMat);
    haze2.renderOrder = 3;
    ringGroup.add(haze2);

    function setDisk(rb: number, rw: number, th: number) {
        uRB.value = rb;
        uRW.value = rw;
        ring.geometry.dispose();
        haze.geometry.dispose();
        ring.geometry = ringBody.geometry = new TorusGeometry(rb, rw, 24, 360);
        haze.geometry = haze2.geometry = new TorusGeometry(rb, rw * 1.9, 20, 240);
        const zs = 0.07 * th * (0.66 / rw);
        ring.scale.set(1, 1, zs);
        ringBody.scale.copy(ring.scale);
        haze.scale.set(1, 1, 0.22 * th * (0.66 / rw));
        haze2.scale.set(1.06, 1.06, 0.3 * th * (0.66 / rw));
    }
    setDisk(look.diskRadius, look.diskWidth, look.diskThickness);

    const particleGeometry = new InstancedBufferGeometry();
    {
        const quad = new PlaneGeometry(1, 1);
        particleGeometry.setAttribute("position", quad.attributes.position);
        particleGeometry.setAttribute("uv", quad.attributes.uv);
        particleGeometry.setIndex(quad.index);
    }
    const particleData = new Float32Array(PARTICLE_COUNT * 8);
    {
        const random = rng(5);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const r = 1.12 + Math.pow(random(), 1.4) * 1.9;
            particleData.set(
                [
                    r,
                    random() * TAU,
                    0.6 + random() * 0.8,
                    (random() - 0.5) * (0.04 + (r - 1.1) * 0.06),
                    0.006 + Math.pow(random(), 3) * 0.022,
                    random(),
                    random() * TAU,
                    random(),
                ],
                i * 8,
            );
        }
    }
    const particleBuffer = new InstancedInterleavedBuffer(particleData, 8);
    const particleMat = new MeshBasicNodeMaterial();
    {
        const pa = instancedBufferAttribute<"vec4">(particleBuffer, "vec4", 8, 0);
        const pb = instancedBufferAttribute<"vec4">(particleBuffer, "vec4", 8, 4);
        const tt = U.time;
        const r = pa.x;
        const ang = pa.y
            .add(tt.mul(pa.z).mul(U.wind.mul(0.8).add(0.2)).mul(pow(r, -1.5)).mul(0.5))
            .add(
                sin(tt.mul(0.35).add(pa.y.mul(3)))
                    .mul(0.08)
                    .mul(U.wind),
            );
        const rr = uRB
            .add(r.sub(1.78).mul(uRW.div(0.66)))
            .add(sin(tt.mul(0.6).add(pb.z)).mul(0.04).mul(U.wind))
            .mul(U.breath.mul(0.04).add(1));
        const wpos = U.ringM.mul(vec4(cos(ang).mul(rr), sin(ang).mul(rr), pa.w, 1)).xyz;
        const qp = attribute<"vec3">("position", "vec3");
        const sz0 = pb.x.mul(U.R).mul(2.2);
        const sz = max(sz0, length(cameraPosition.sub(wpos)).mul(0.0032));
        const ptFade = varying(pow(sz0.div(sz), 2));
        particleMat.positionNode = wpos.add(U.camR.mul(qp.x).add(U.camU.mul(qp.y)).mul(sz));
        const vb = varying(pb);
        const vr = varying(r);
        const d = length(uv().sub(0.5)).mul(2);
        const tw = sin(tt.mul(2.6).add(vb.z.mul(5)))
            .mul(0.4)
            .add(0.6);
        const fade = smoothstep(float(1.08), float(1.25), vr).mul(
            float(1).sub(smoothstep(float(2.4), float(3.0), vr)),
        );
        glowOutput(
            particleMat,
            mix(accentAt(vb.y.mul(U.nAcc), S), vec3(1, 1, 1), exp(d.mul(d).mul(-30)).mul(0.5)),
            exp(d.mul(d).mul(-6)).mul(tw).mul(fade).mul(ptFade).mul(1.4),
            U.light,
        );
    }
    const particles = new Mesh(particleGeometry, particleMat);
    particles.frustumCulled = false;
    particles.renderOrder = 4;
    scene.add(particles);
    particleGeometry.instanceCount = Math.round(
        PARTICLE_COUNT * MathUtils.clamp(look.particles, 0, 1),
    );

    const flashGeometry = new InstancedBufferGeometry();
    {
        const quad = new PlaneGeometry(1, 1);
        flashGeometry.setAttribute("position", quad.attributes.position);
        flashGeometry.setAttribute("uv", quad.attributes.uv);
        flashGeometry.setIndex(quad.index);
    }
    flashGeometry.instanceCount = FLASH_COUNT;
    const flashData = new Float32Array(FLASH_COUNT * 8);
    const flashBuffer = new InstancedInterleavedBuffer(flashData, 8);
    const flashMat = new MeshBasicNodeMaterial();
    {
        const fp = instancedBufferAttribute<"vec4">(flashBuffer, "vec4", 8, 0);
        const fc = instancedBufferAttribute<"vec4">(flashBuffer, "vec4", 8, 4);
        const quad = attribute<"vec3">("position", "vec3");
        flashMat.positionNode = fp.xyz.add(U.camR.mul(quad.x).add(U.camU.mul(quad.y)).mul(fp.w));
        const vfc = varying(fc);
        const d = length(uv().sub(0.5)).mul(2);
        const core = exp(d.mul(d).mul(-40));
        glowOutput(
            flashMat,
            mix(vfc.xyz, vec3(1, 1, 1), core.mul(0.3)),
            exp(d.mul(d).mul(-7)).add(core.mul(0.8)).mul(vfc.w),
            U.light,
        );
    }
    const flashMesh = new Mesh(flashGeometry, flashMat);
    flashMesh.frustumCulled = false;
    flashMesh.renderOrder = 4;
    scene.add(flashMesh);
    const flashes = Array.from({ length: FLASH_COUNT }, () => ({
        life: 0,
        max: 1,
        position: new Vector3(),
        size: 1,
        color: new Color(),
    }));
    let flashIndex = 0;

    const uCenter = uniform(new Vector2(0.5, 0.5));
    const uAspect = uniform(1);
    const uRs = uniform(0.2);
    const uLens = uniform(1);
    const uCore = uniform(new Color());

    /** Bends the rendered scene around the hole, with a slight colour split, and shades its shadow. */
    function lens(sceneColor: SceneColorNode): Node<"vec4"> {
        const dd = screenUV.sub(uCenter).mul(vec2(uAspect, 1));
        const lr = max(length(dd), 1e-4);
        const thE = uRs.mul(0.72).mul(uLens);
        const falloff = float(1).sub(smoothstep(uRs.mul(2.5), uRs.mul(7.5), lr));
        const offset = thE.mul(thE).div(lr).mul(falloff);
        const dir = dd.div(lr).div(vec2(uAspect, 1));
        const shadow = smoothstep(float(0.8), float(1.0), offset.div(lr));
        return vec4(
            mix(
                vec3(
                    sceneColor.sample(screenUV.sub(dir.mul(offset.mul(1.04)))).r,
                    sceneColor.sample(screenUV.sub(dir.mul(offset))).g,
                    sceneColor.sample(screenUV.sub(dir.mul(offset.mul(0.96)))).b,
                ),
                uCore,
                shadow,
            ),
            1,
        );
    }

    /** The streamlines are traced around the origin, so the hole stays there. */
    const position = new Vector3();
    let tubeGeometry = new BufferGeometry();
    let tubes: Mesh | undefined;
    let lines: Line[] = [];
    let lineEnds: number[] = [0];
    let farCount = 0;
    let drawnCount = -1;
    /** World radius the streamlines were built around. */
    let buildR = 100;

    function build(R: number, small: boolean) {
        isSmall = small;
        buildR = R;
        U.R.value = buildR;
        sphere.scale.setScalar(buildR);
        halo.scale.setScalar(buildR);
        ringGroup.scale.setScalar(buildR);
        const built = buildStreamlines(R, isSmall ? 120 : 400, isSmall);
        lines = built.lines;
        lineEnds = built.tubes.tubeEnds;
        farCount = built.farCount;
        const geometry = createTubeGeometry(built.tubes);
        // The disk drag and camera shakes move lines a little off their traced path.
        geometry.computeBoundingSphere();
        if (geometry.boundingSphere) geometry.boundingSphere.radius += R * 2;
        tubeGeometry.dispose();
        tubeGeometry = geometry;
        if (tubes) {
            tubes.geometry = geometry;
        } else {
            tubes = new Mesh(geometry, tubeMat);
            tubes.renderOrder = 2;
            scene.add(tubes);
        }
        drawnCount = -1;
    }

    let phase = 0;
    let energy = 0;
    /** 1 while the hole is the active landmark, 0 while another is; eased between. */
    let presence = 1;
    let tintAmount = 0;
    const tint = new Color();
    const lineTint = new Color();
    const toCamera = new Vector3();
    const ndc = new Vector3();
    const projected = new Vector3();
    const previousCamera = new Vector3();
    const cameraVelocity = new Vector3();
    const cameraDirection = new Vector3();
    const segment = new Vector3();
    const closest = new Vector3();
    const candidate = new Vector3();
    const black = new Color(0, 0, 0);
    const coreDark = new Color();

    function lineColor(hue: number, out: Color): Color {
        const current = currentColors();
        if (!current) return out;
        if (hue < ACCENT_SHARE) {
            const index = Math.min(
                current.acc.length - 1,
                Math.floor((hue / ACCENT_SHARE) * current.acc.length),
            );
            return out.copy(current.acc[index]);
        }
        const index = Math.min(
            current.pal.length - 1,
            Math.floor(((hue - ACCENT_SHARE) / (1 - ACCENT_SHARE)) * current.pal.length),
        );
        return out.copy(current.pal[index]);
    }

    function pan(point: Vector3): number {
        projected.copy(point).project(camera);
        return MathUtils.clamp(projected.x, -1, 1);
    }

    function spawnFlash(line: Line) {
        flashIndex = (flashIndex + 1) % FLASH_COUNT;
        const flash = flashes[flashIndex];
        flash.position
            .copy(line.end)
            .multiplyScalar(buildR * 1.01)
            .add(position);
        flash.max = flash.life = 0.45 + Math.random() * 0.35;
        flash.size = buildR * (line.hue < ACCENT_SHARE ? 0.2 : 0.14) * (0.8 + Math.random() * 0.5);
        lineColor(line.hue, flash.color);
        emit({
            type: "absorb",
            hue: line.hue,
            pan: pan(flash.position),
            strength: 0.3 + 0.7 * line.weight,
        });
    }

    function shakeLine(
        line: Line,
        point: Vector3,
        direction: Vector3,
        distance: number,
        strength: number,
    ) {
        shakeIndex = (shakeIndex + 1) % SHAKES.length;
        const S = SHAKES[shakeIndex];
        S.a.value.set(
            line.hue,
            U.time.value,
            distance * 0.035 * (0.7 + 0.8 * line.weight) * strength,
            0,
        );
        S.p.value.copy(point);
        S.v.value.set(direction.x, direction.y, direction.z, TAU / (distance * 0.22));
    }

    function distanceToLine(line: Line, point: Vector3, out: Vector3): number {
        let best = Infinity;
        const samples = line.samples;
        for (let k = 0; k < samples.length - 1; k++) {
            const a = samples[k];
            segment.subVectors(samples[k + 1], a);
            const ll = segment.lengthSq();
            if (!ll) continue;
            const t = MathUtils.clamp(candidate.subVectors(point, a).dot(segment) / ll, 0, 1);
            candidate.copy(a).addScaledVector(segment, t);
            const dd = candidate.distanceToSquared(point);
            if (dd < best) {
                best = dd;
                out.copy(candidate);
            }
        }
        return Math.sqrt(best);
    }

    function update({
        dt,
        now,
        distance,
        viewDistance,
        cameraSpeed,
        cut,
        isActive,
        W,
        H,
    }: LandmarkFrame) {
        const current = currentColors();
        if (!current) return;
        const visibleCount = Math.max(
            1,
            Math.min(lines.length - farCount, Math.round(look.lineCount * (isSmall ? 0.3 : 1))),
        );
        if (visibleCount !== drawnCount) {
            drawnCount = visibleCount;
            tubeGeometry.setDrawRange(0, lineEnds[farCount + drawnCount] ?? 0);
        }
        if (!isStill) phase += dt * PULSE_SPEED * look.speed;
        U.phase.value = phase;
        U.lineSat.value = look.lineSat;
        U.lineGlow.value = look.lineGlow;
        U.pulseShape.value = 1 + 5 * (1 - look.pulseWidth);
        U.blur.value = look.dof;
        ringGroup.rotation.set(MathUtils.degToRad(look.ringTilt), 0, -0.38);
        if (!isStill) ring.rotation.z += dt * 0.04;
        ringBody.rotation.z = ring.rotation.z;
        haze.rotation.z = haze2.rotation.z = ring.rotation.z * 0.6;
        const bt = U.time.value;
        const breathWave =
            Math.sin((bt * TAU) / 5.5) * 0.75 + Math.sin((bt * TAU) / 2.1 + 1.3) * 0.25;
        U.breath.value = breathWave * look.breath;
        const kickAge = (now - kickAt) / 1000;
        const kick = isStill || kickAge > 1.2 ? 0 : kickAmount * Math.exp(-kickAge * 7);
        const breathScale =
            (1 + 0.055 * look.breath * breathWave) * (1 + 0.035 * look.kickPulse * kick);
        sphere.scale.setScalar(buildR * breathScale);
        halo.scale.setScalar(
            buildR * (1 + 0.09 * look.breath * breathWave) * (1 + 0.06 * look.kickPulse * kick),
        );
        U.wind.value = look.wind;
        U.ringBlur.value = look.ringBlur;
        ringGroup.updateMatrixWorld(true);
        U.ringM.value.copy(ringGroup.matrixWorld);
        uRingMi.value.copy(ringGroup.matrixWorld).invert();
        uDiskTh.value = look.diskThickness;
        uDiskPull.value = look.diskPull;
        uDiskGlow.value = look.diskLineGlow;

        ndc.copy(position).applyMatrix4(camera.matrixWorldInverse);
        const isInFront = ndc.z < 0;
        ndc.copy(position).project(camera);
        uCenter.value.set((ndc.x + 1) / 2, (1 - ndc.y) / 2);
        uAspect.value = W / H;
        uRs.value =
            (buildR * breathScale * (H / 2)) /
            (Math.tan(MathUtils.degToRad(camera.fov / 2)) * distance) /
            H;
        uLens.value = isInFront ? look.lens : 0;
        U.ringGlow.value = look.ringGlow;
        U.absorb.value = look.absorb;
        U.depth.value = look.atomDepth;
        coreDark.copy(current.bg0).lerp(black, look.atomDepth);
        U.core.value
            .copy(current.fg)
            .lerp(black, 0.3 + 0.7 * look.atomDepth)
            .lerp(coreDark, 1 - S.light.value);
        uCore.value.copy(U.core.value);
        U.haloC.value.copy(U.core.value);
        halo.quaternion.copy(camera.quaternion);

        VOID_PATCHES.forEach(([b, a, r], j) => {
            const c = flowDir
                .clone()
                .multiplyScalar(b + 420 * Math.sin(bt * 0.05 + j * 1.9))
                .addScaledVector(flowSide, a + 360 * Math.cos(bt * 0.04 + j * 2.3))
                .addScaledVector(flowUp, 260 * Math.sin(bt * 0.03 + j));
            VOIDS[j].value.set(c.x, c.y, c.z, r * (0.85 + 0.15 * Math.sin(bt * 0.07 + j)));
        });

        if (!isStill) {
            toCamera.subVectors(camera.position, position).normalize();
            for (let i = farCount; i < farCount + drawnCount; i++) {
                const line = lines[i];
                if (!line?.hit) continue;
                const pulse = Math.floor((line.length - phase - line.offset) / line.gap);
                if (
                    line.lastPulse !== undefined &&
                    pulse < line.lastPulse &&
                    line.end.dot(toCamera) > 0.05
                ) {
                    energy += 0.03;
                    spawnFlash(line);
                    tint.lerp(lineColor(line.hue, lineTint), 0.08);
                    tintAmount = Math.min(0.5, tintAmount + 0.03);
                }
                line.lastPulse = pulse;
            }

            if (cut) previousCamera.copy(camera.position);
            cameraVelocity.subVectors(camera.position, previousCamera);
            previousCamera.copy(camera.position);
            // A cut only records which lines are near, so the new view starts without a burst of shakes.
            if (cut || cameraVelocity.lengthSq() > 1e-6) {
                const threshold = viewDistance * look.camBody;
                for (let i = farCount; i < farCount + drawnCount; i++) {
                    const line = lines[i];
                    if (!line) continue;
                    line.cooldown -= dt;
                    const isNear = distanceToLine(line, camera.position, closest) < threshold;
                    if (!cut && isNear && !line.isNear && line.cooldown <= 0) {
                        line.cooldown = 0.5;
                        cameraDirection.copy(cameraVelocity).normalize();
                        const first = line.samples[0];
                        const end = line.samples.at(-1);
                        if (first && end && line.samples.length > 1) {
                            segment.subVectors(end, first).normalize();
                            cameraDirection.addScaledVector(segment, -cameraDirection.dot(segment));
                        }
                        if (cameraDirection.lengthSq() < 1e-4) {
                            cameraDirection.subVectors(closest, camera.position);
                        }
                        cameraDirection.normalize();
                        const strength = Math.min(1.6, 0.5 + cameraSpeed * 1.5);
                        shakeLine(line, closest, cameraDirection, viewDistance, strength);
                        emit({
                            type: "absorb",
                            hue: line.hue,
                            pan: pan(closest),
                            strength: Math.min(1, strength / 1.2),
                        });
                    }
                    line.isNear = isNear;
                }
            }
        }
        energy = Math.min(1.6, energy * Math.exp(-dt * 1.4));
        tintAmount *= Math.exp(-dt * 0.35);
        U.energy.value = energy;
        presence =
            cut || isStill
                ? Number(isActive)
                : presence + (Number(isActive) - presence) * (1 - Math.exp(-dt * 2));
        U.nearEnd.value = 900 + (1 - presence) * viewDistance * 0.5;
        U.recede.value = 1 - (1 - presence) * MathUtils.lerp(0.25, 0.7, S.light.value);
        U.rim.value.copy(current.fg).lerp(tint, Math.min(1, tintAmount * 1.8));
        flashes.forEach((flash, i) => {
            if (flash.life > 0) flash.life -= dt;
            const share = flash.life > 0 ? flash.life / flash.max : 0;
            flashData.set(
                [
                    flash.position.x,
                    flash.position.y,
                    flash.position.z,
                    flash.size * (1.4 - 0.6 * share),
                    flash.color.r,
                    flash.color.g,
                    flash.color.b,
                    share * share * 1.1,
                ],
                i * 8,
            );
        });
        flashBuffer.needsUpdate = true;
    }

    let kickAt = -Infinity;
    let kickAmount = 0;
    let seatsAt = -Infinity;
    let seats: Line[] = [];
    const viewPoint = new Vector3();

    /** How much of a line is lit and on screen: drawn, in front, not too near, not lost in fog or a void. */
    function visibleScore(line: Line, viewDistance: number): number {
        let score = 0;
        line.samples.forEach((point, k) => {
            const arc = line.sampleArcs[k] ?? 0;
            if (arc < 2800 || (!line.hit && arc > line.length - 1000)) return;
            if (point.distanceTo(position) < buildR * 1.8) return;
            viewPoint.copy(point).applyMatrix4(camera.matrixWorldInverse);
            const z = -viewPoint.z;
            if (z < Math.max(300, viewDistance * 0.25) || z > viewDistance * 5) return;
            viewPoint.copy(point).project(camera);
            if (Math.abs(viewPoint.x) > 0.92 || Math.abs(viewPoint.y) > 0.92) return;
            const isInVoid = VOIDS.some(({ value: v }) => {
                return Math.hypot(point.x - v.x, point.y - v.y, point.z - v.z) < v.w * 0.75;
            });
            if (!isInVoid) score += 1;
        });
        return score;
    }

    function bestLines(viewDistance: number, minimum: number, limit: number): Line[] {
        return lines
            .map((line) => ({ line, score: visibleScore(line, viewDistance) }))
            .filter(({ score }) => score >= minimum)
            .toSorted((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ line }) => line);
    }

    function sing({ pitch, delay, duration, amp }: SingNote) {
        if (isStill || !lines.length) return;
        camera.updateMatrixWorld();
        const viewDistance = camera.position.distanceTo(position);
        const now = U.time.value;
        // Seats are re-ranked at most four times a second, so one pitch keeps its line while the view holds.
        if (now - seatsAt > 0.25 || !seats.length) {
            seatsAt = now;
            seats = bestLines(viewDistance, 5, 24);
            if (!seats.length) seats = bestLines(viewDistance, 1, 12);
        }
        if (!seats.length) return;
        const line = seats[(((pitch * 7) % seats.length) + seats.length) % seats.length];
        let start = now + Math.max(0, delay);
        const end = start + Math.max(0.9, duration);
        const current = SINGERS.find((singer) => singer.id.value === line.id);
        if (current && current.end.value + U.singDecay.value > start) {
            start = Math.min(start, current.start.value);
        }
        const singer =
            current ??
            SINGERS.reduce((oldest, candidate) =>
                candidate.end.value < oldest.end.value ? candidate : oldest,
            );
        singer.end.value = Math.max(end, singer.id.value === line.id ? singer.end.value : 0);
        singer.id.value = line.id;
        singer.start.value = start;
        singer.amp.value = Math.max(0.6, amp);
    }

    return {
        position,
        get radius() {
            return buildR;
        },
        get energy() {
            return energy;
        },
        build,
        lens,
        update,
        sing,
        pulse(amount: number) {
            kickAt = performance.now();
            kickAmount = amount;
        },
        dispose() {
            [
                tubeMat,
                sphereMat,
                haloMat,
                ringMat,
                ringBodyMat,
                hazeMat,
                particleMat,
                flashMat,
            ].forEach((material) => material.dispose());
            [
                tubeGeometry,
                sphere.geometry,
                halo.geometry,
                ring.geometry,
                haze.geometry,
                particleGeometry,
                flashGeometry,
            ].forEach((geometry) => geometry.dispose());
        },
    };
}
