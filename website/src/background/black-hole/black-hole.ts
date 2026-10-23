import {
    BufferAttribute,
    BufferGeometry,
    Color,
    CustomBlending,
    DoubleSide,
    Group,
    InstancedBufferGeometry,
    InstancedInterleavedBuffer,
    InterleavedBuffer,
    InterleavedBufferAttribute,
    MathUtils,
    Matrix4,
    Mesh,
    MeshBasicNodeMaterial,
    OneFactor,
    OneMinusSrcAlphaFactor,
    PerspectiveCamera,
    PlaneGeometry,
    RenderPipeline,
    Scene,
    SphereGeometry,
    TorusGeometry,
    Vector2,
    Vector3,
    Vector4,
    WebGPURenderer,
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
    floor,
    fract,
    fwidth,
    instancedBufferAttribute,
    length,
    max,
    mix,
    normalWorld,
    pass,
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
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { createEmitter } from "#/background/emitter.ts";
import { createGrain } from "#/background/grain.ts";
import { rng } from "#/background/rng.ts";
import type {
    BackgroundRenderer,
    RendererOptions,
    SceneTheme,
    SingNote,
} from "#/background/types.ts";
import {
    ACCENT_SHARE,
    STRIDE,
    buildStreamlines,
    flowDir,
    flowSide,
    flowUp,
    type Line,
} from "./field.ts";
import { look as tunedLook, type Look } from "./look.ts";

const TAU = Math.PI * 2;
/** Pulse speed along the lines, world units per second. */
const PULSE_SPEED = 90;
const FLASH_COUNT = 48;
const PARTICLE_COUNT = 3600;
const HALO_SCALE = 3.2;
const PALETTE_VARS = [
    "--ba-c-red",
    "--ba-c-yellow",
    "--ba-c-green",
    "--ba-c-cyan",
    "--ba-c-blue",
    "--ba-c-magenta",
    "--ba-c-gray",
] as const;
const VOID_PATCHES = [
    [-2000, 1300, 1150],
    [2300, -1500, 1300],
    [-600, -2900, 1000],
    [3400, 1700, 1200],
] as const;
/** Camera speed (view distances per second) above which the camera counts as moving. */
const MOVING_SPEED = 0.12;
const SETTLED_SPEED = 0.08;

type Emit = ReturnType<typeof createEmitter>["emit"];

interface Colors {
    bg0: Color;
    fg: Color;
    acc: Color[];
    pal: Color[];
}

interface Frame {
    x: number;
    y: number;
    /** Hole radius in screen pixels. */
    r: number;
}

async function hasWebGPU(): Promise<boolean> {
    if (!("gpu" in navigator)) return false;
    try {
        return (await navigator.gpu.requestAdapter()) !== null;
    } catch {
        return false;
    }
}

function hasWebGL2(): boolean {
    return document.createElement("canvas").getContext("webgl2") !== null;
}

function themeColors({ vars }: SceneTheme): Colors & { accentCount: number } {
    const color = (hex: string) => new Color().setStyle(hex);
    const acc = [color(vars["--ba-accent"]), color(vars["--ba-accent-2"])];
    const accentCount = acc.length;
    while (acc.length < 4) acc.push((acc.at(-1) ?? new Color()).clone());
    return {
        bg0: color(vars["--ba-bg"]),
        fg: color(vars["--ba-fg"]),
        acc,
        pal: PALETTE_VARS.map((name) => color(vars[name])),
        accentCount,
    };
}

/** Premultiplied output: alpha 0 adds light on dark themes, alpha `a` blends normally on light ones. */
function glowOutput(
    material: MeshBasicNodeMaterial,
    colorNode: Node<"vec3">,
    intensity: Node<"float">,
    light: Node<"float">,
    lift = 2.2,
) {
    const alpha = clamp(intensity.mul(lift), 0, 1);
    material.colorNode = mix(colorNode.mul(intensity), colorNode.mul(alpha), light);
    material.opacityNode = alpha.mul(light);
    material.transparent = true;
    material.depthWrite = false;
    material.blending = CustomBlending;
    material.blendSrc = OneFactor;
    material.blendDst = OneMinusSrcAlphaFactor;
    material.blendSrcAlpha = OneFactor;
    material.blendDstAlpha = OneMinusSrcAlphaFactor;
}

function holeAnchor(): Element | null {
    return document.querySelector('[data-scene-anchor="hole"], [data-scene-anchor="far-hole"]');
}

/**
 * Builds the scene on a WebGPU renderer (WebGL 2 when WebGPU is missing). Lines flow past and into
 * a black hole whose place and size come from the page's hole anchor.
 */
async function createScene(host: HTMLElement, look: Look, isStill: boolean, emit: Emit) {
    const isWebGPU = await hasWebGPU();
    if (!isWebGPU && !hasWebGL2()) throw new Error("neither WebGPU nor WebGL 2 is available");
    const renderer = new WebGPURenderer({ antialias: true, forceWebGL: !isWebGPU });
    await renderer.init();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 1000 ? 2 : 1.5));
    renderer.domElement.dataset.backend = isWebGPU ? "webgpu" : "webgl2";
    host.appendChild(renderer.domElement);

    const html = document.documentElement;
    const scene = new Scene();
    const camera = new PerspectiveCamera(35, 1, 5, 40000);
    let W = 0;
    let H = 0;
    let D = 1000;
    let pageHeight = 0;
    let isSmall = innerWidth < 700;

    const U = {
        R: uniform(100),
        phase: uniform(0),
        time: uniform(0),
        rim: uniform(new Color()),
        core: uniform(new Color()),
        light: uniform(0),
        fogStart: uniform(1200),
        fogK: uniform(1 / 2400),
        energy: uniform(0),
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
        focus: uniform(1200),
        focusIn: uniform(260),
        focusR: uniform(900),
        blur: uniform(0.6),
        nAcc: uniform(2),
        camR: uniform(new Vector3(1, 0, 0)),
        camU: uniform(new Vector3(0, 1, 0)),
        thick: uniform(1),
        singGlow: uniform(look.singGlow),
        singDecay: uniform(look.singDecay),
    };
    const ACC = [0, 1, 2, 3].map(() => uniform(new Color()));
    const PAL = PALETTE_VARS.map(() => uniform(new Color()));
    const accNodes = ACC.map((u) => u.rgb);
    const palNodes = PAL.map((u) => u.rgb);
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
        const isAccent = h.lessThan(ACCENT_SHARE);
        const ai = floor(h.div(ACCENT_SHARE).mul(U.nAcc));
        const pi = floor(
            h
                .sub(ACCENT_SHARE)
                .div(1 - ACCENT_SHARE)
                .mul(PAL.length),
        );
        let accC: Node<"vec3"> = accNodes[3];
        for (let k = 2; k >= 0; k--) accC = select(ai.lessThan(k + 0.5), accNodes[k], accC);
        let palC: Node<"vec3"> = palNodes[palNodes.length - 1];
        for (let k = palNodes.length - 2; k >= 0; k--) {
            palC = select(pi.lessThan(k + 0.5), palNodes[k], palC);
        }
        const lc = select(isAccent, accC, palC);

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
        const nearF = smoothstep(float(160), float(900), depth);
        const endF = smoothstep(float(0), float(2600), s).mul(
            mix(smoothstep(float(0), float(900), len.sub(s)), float(1), hit),
        );
        let vf: Node<"float"> = float(1);
        VOIDS.forEach((v) => {
            vf = vf.mul(smoothstep(float(0.3), float(1), length(vC.sub(v.xyz)).div(v.w)));
        });
        const env = shade.mul(prof).mul(fog).mul(nearF).mul(endF).mul(vf).mul(vanish);
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

    /** Blends the accents around the ring by phase `ph` (0..nAcc). */
    function accentAt(ph: Node<"float">): Node<"vec3"> {
        const seg = (k: number) =>
            smoothstep(
                float(0.62),
                float(0.38),
                abs(ph.sub(k))
                    .min(abs(ph.sub(k).sub(U.nAcc)))
                    .min(abs(ph.sub(k).add(U.nAcc))),
            );
        let mixed: Node<"vec3"> = accNodes[0].mul(seg(0));
        let weight: Node<"float"> = seg(0);
        for (let k = 1; k < 4; k++) {
            const wk = seg(k).mul(select(U.nAcc.greaterThan(k - 0.5), float(1), float(0)));
            mixed = mixed.add(accNodes[k].mul(wk));
            weight = weight.add(wk);
        }
        return mixed.div(weight.add(1e-4));
    }

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
        const accMix = accentAt(ph);
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
        const hc = accentAt(fract(ha.sub(tt.mul(0.035))).mul(U.nAcc));
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
            mix(accentAt(vb.y.mul(U.nAcc)), vec3(1, 1, 1), exp(d.mul(d).mul(-30)).mul(0.5)),
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

    const pipeline = new RenderPipeline(renderer);
    const scenePass = pass(scene, camera, { samples: 4 });
    const sceneColor = scenePass.getTextureNode("output");
    const uCenter = uniform(new Vector2(0.5, 0.5));
    const uAspect = uniform(1);
    const uRs = uniform(0.2);
    const uLens = uniform(1);
    const uCore = uniform(new Color());
    const lensBloom = (() => {
        const dd = screenUV.sub(uCenter).mul(vec2(uAspect, 1));
        const lr = max(length(dd), 1e-4);
        const thE = uRs.mul(0.72).mul(uLens);
        const falloff = float(1).sub(smoothstep(uRs.mul(2.5), uRs.mul(7.5), lr));
        const offset = thE.mul(thE).div(lr).mul(falloff);
        const dir = dd.div(lr).div(vec2(uAspect, 1));
        const shadow = smoothstep(float(0.8), float(1.0), offset.div(lr));
        const lensed = vec4(
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
        const glow = bloom(lensed, 0.6, 0.35, 0.7);
        pipeline.outputNode = lensed.add(glow);
        return glow;
    })();

    let tubeGeometry = new BufferGeometry();
    let tubes: Mesh | undefined;
    let lines: Line[] = [];
    let lineEnds: number[] = [0];
    let farCount = 0;
    let drawnCount = -1;
    let builtFor = "";
    /** World radius the streamlines were built around. */
    let buildR = 100;
    let target: Frame = { x: 0, y: 0, r: 100 };
    let frame: Frame | undefined;
    let lastFrameX = 0;
    let lastFrameY = 0;
    /** False until the camera has a position to measure motion from. */
    let hasCameraPosition = false;

    function build(R: number) {
        const built = buildStreamlines(R, isSmall ? 120 : 400, isSmall);
        lines = built.lines;
        lineEnds = built.lineEnds;
        farCount = built.farCount;
        const buffer = new InterleavedBuffer(built.vertices, STRIDE);
        const geometry = new BufferGeometry();
        geometry.setAttribute("center", new InterleavedBufferAttribute(buffer, 3, 0));
        geometry.setAttribute("nrm", new InterleavedBufferAttribute(buffer, 3, 3));
        geometry.setAttribute("dat", new InterleavedBufferAttribute(buffer, 4, 6));
        geometry.setAttribute("ext", new InterleavedBufferAttribute(buffer, 4, 10));
        geometry.setAttribute("position", new InterleavedBufferAttribute(buffer, 3, 0));
        geometry.setIndex(new BufferAttribute(built.indices, 1));
        tubeGeometry.dispose();
        tubeGeometry = geometry;
        if (tubes) {
            tubes.geometry = geometry;
        } else {
            tubes = new Mesh(geometry, tubeMat);
            tubes.frustumCulled = false;
            tubes.renderOrder = 2;
            scene.add(tubes);
        }
        drawnCount = -1;
    }

    /**
     * Reads the hole anchor. The streamlines are built once per viewport size around the first hole
     * seen; a different anchor later moves the camera instead of rebuilding.
     */
    function measure() {
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
        if (viewportKey === builtFor) return;
        builtFor = viewportKey;
        buildR = target.r;
        U.R.value = buildR;
        sphere.scale.setScalar(buildR);
        halo.scale.setScalar(buildR);
        ringGroup.scale.setScalar(buildR);
        build(buildR);
        frame = { ...target };
        lastFrameX = frame.x;
        lastFrameY = frame.y;
        hasCameraPosition = false;
    }

    function size() {
        W = innerWidth;
        H = innerHeight;
        isSmall = W < 700;
        renderer.setSize(W, H);
        camera.aspect = W / H;
        D = H / 2 / Math.tan(MathUtils.degToRad(camera.fov / 2));
        camera.updateProjectionMatrix();
    }

    let colors: Colors | undefined;
    let colorTarget: Colors | undefined;
    let isLight = false;
    let lightMix = 0;
    const background = new Color();

    function pushColors(current: Colors) {
        ACC.forEach((u, k) => u.value.copy(current.acc[k]));
        PAL.forEach((u, k) => u.value.copy(current.pal[k]));
    }

    function setTheme(theme: SceneTheme) {
        const next = themeColors(theme);
        isLight = theme.appearance === "light";
        U.nAcc.value = next.accentCount;
        if (!colors || isStill) {
            colors = next;
            colorTarget = undefined;
            lightMix = isLight ? 1 : 0;
        } else {
            colorTarget = next;
        }
        scene.background = background;
        pushColors(colors);
        grain.setLight(isLight);
        stillFrames = 2;
    }

    function stepColors(dt: number) {
        if (!colors || !colorTarget) return;
        const k = 1 - Math.exp(-dt * 2.6);
        const current = colors;
        const next = colorTarget;
        current.bg0.lerp(next.bg0, k);
        current.fg.lerp(next.fg, k);
        current.acc.forEach((c, i) => c.lerp(next.acc[i], k));
        current.pal.forEach((c, i) => c.lerp(next.pal[i], k));
        pushColors(current);
        const left =
            Math.abs(current.bg0.r - next.bg0.r) +
            Math.abs(current.fg.g - next.fg.g) +
            Math.abs(current.acc[0].b - next.acc[0].b);
        if (left < 0.0005) colorTarget = undefined;
    }

    const listeners = new AbortController();
    const { signal } = listeners;
    let yaw = 0;
    let yawSmooth = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let resizeTimer = 0;
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
    addEventListener(
        "resize",
        () => {
            clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                size();
                measure();
                stillFrames = 2;
            }, 180);
        },
        { signal },
    );
    void document.fonts.ready.then(() => {
        if (!signal.aborted) measure();
    });

    const grain = createGrain();
    size();
    measure();

    let last = performance.now();
    let frameNumber = 0;
    let phase = 0;
    let energy = 0;
    let tintAmount = 0;
    let scroll = 0;
    let orbitAngle = 0;
    let stillFrames = 2;
    let remeasureUntil = 0;
    let cameraSpeed = 0;
    let cameraDrift = 0;
    let isMoving = false;
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
    const camPrevious = new Vector3();
    const camStep = new Vector3();
    const camRight = new Vector3();

    function lineColor(hue: number, out: Color): Color {
        const current = colors;
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
        flash.position.copy(line.end).multiplyScalar(buildR * 1.01);
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

    function emitCamera(speed: number, drift: number) {
        if (!isMoving && speed > MOVING_SPEED) {
            isMoving = true;
            emit({ type: "camera", speed, drift, phase: "start" });
        } else if (isMoving && speed < SETTLED_SPEED) {
            isMoving = false;
            emit({ type: "camera", speed, drift, phase: "settle" });
        } else if (isMoving) {
            emit({ type: "camera", speed, drift, phase: "move" });
        }
    }

    function render() {
        const current = colors;
        if (!current || !frame) return;
        if (isStill && stillFrames <= 0) return;
        stillFrames -= 1;
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        frameNumber += 1;
        if (frameNumber % 120 === 1 || now < remeasureUntil) measure();
        grain.tick(isStill ? 0 : now);
        stepColors(dt);
        lightMix += ((isLight ? 1 : 0) - lightMix) * (1 - Math.exp(-dt * 2.6));
        if (Math.abs(lightMix - (isLight ? 1 : 0)) < 0.002) lightMix = isLight ? 1 : 0;
        U.light.value = lightMix;

        const visibleCount = Math.max(
            1,
            Math.min(lines.length - farCount, Math.round(look.lineCount * (isSmall ? 0.3 : 1))),
        );
        if (visibleCount !== drawnCount) {
            drawnCount = visibleCount;
            tubeGeometry.setDrawRange(0, lineEnds[farCount + drawnCount] ?? 0);
        }
        if (!isStill) {
            phase += dt * PULSE_SPEED * look.speed;
            U.time.value += dt;
        }
        U.phase.value = phase;
        U.lineSat.value = look.lineSat;
        U.lineGlow.value = look.lineGlow;
        U.pulseShape.value = 1 + 5 * (1 - look.pulseWidth);
        U.blur.value = look.dof;
        lensBloom.strength.value = look.bloom * (1 - 0.7 * lightMix);
        lensBloom.threshold.value = 0.7 + 0.32 * lightMix;
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
            -80 * scroll * look.lookAround + yawSmooth + orbitAngle + pointerX * 6 * look.parallax,
        );
        const pitch = MathUtils.degToRad(
            (4 + 34 * scroll) * look.lookAround - pointerY * 4 * look.parallax,
        );
        const distance = D * (1 + 0.55 * scroll * look.lookAround) * (buildR / frame.r);
        U.thick.value = buildR / frame.r;
        camera.position
            .set(
                Math.sin(yawAngle) * Math.cos(pitch),
                Math.sin(pitch),
                Math.cos(yawAngle) * Math.cos(pitch),
            )
            .multiplyScalar(distance);
        if (!hasCameraPosition) camPrevious.copy(camera.position);
        const cameraMove = camPrevious.distanceTo(camera.position) / distance / Math.max(dt, 1e-3);
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
        U.focus.value = distance;
        U.fogStart.value = distance * 0.9;
        ndc.set(0, 0, 0).project(camera);
        uCenter.value.set((ndc.x + 1) / 2, (1 - ndc.y) / 2);
        uAspect.value = W / H;
        uRs.value =
            (buildR * breathScale * (H / 2)) /
            (Math.tan(MathUtils.degToRad(camera.fov / 2)) * distance) /
            H;
        uLens.value = look.lens;
        U.ringGlow.value = look.ringGlow;
        U.absorb.value = look.absorb;
        U.depth.value = look.atomDepth;
        background.copy(current.bg0).lerp(current.fg, 0.07 * look.lightContrast * lightMix);
        coreDark.copy(current.bg0).lerp(black, look.atomDepth);
        U.core.value
            .copy(current.fg)
            .lerp(black, 0.3 + 0.7 * look.atomDepth)
            .lerp(coreDark, 1 - lightMix);
        uCore.value.copy(U.core.value);
        U.haloC.value.copy(U.core.value);
        U.camR.value.setFromMatrixColumn(camera.matrixWorld, 0);
        U.camU.value.setFromMatrixColumn(camera.matrixWorld, 1);
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
            toCamera.copy(camera.position).normalize();
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

            if (!hasCameraPosition) previousCamera.copy(camera.position);
            cameraVelocity.subVectors(camera.position, previousCamera);
            previousCamera.copy(camera.position);
            if (cameraVelocity.lengthSq() > 1e-6) {
                const threshold = distance * look.camBody;
                for (let i = farCount; i < farCount + drawnCount; i++) {
                    const line = lines[i];
                    if (!line) continue;
                    line.cooldown -= dt;
                    const isNear = distanceToLine(line, camera.position, closest) < threshold;
                    if (isNear && !line.isNear && line.cooldown <= 0) {
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
                        shakeLine(line, closest, cameraDirection, distance, strength);
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
            hasCameraPosition = true;
        }
        energy = Math.min(1.6, energy * Math.exp(-dt * 1.4));
        tintAmount *= Math.exp(-dt * 0.35);
        U.energy.value = energy;
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
        pipeline.render();

        if (!isStill) {
            emit({ type: "proximity", distance: distance / D, energy });
            emitCamera(cameraSpeed, cameraDrift);
        }
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
            if (point.length() < buildR * 1.8) return;
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
        const viewDistance = camera.position.length();
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

    let hasFailed = false;
    function tick() {
        try {
            render();
        } catch (error) {
            if (!hasFailed) {
                hasFailed = true;
                console.warn("[background] black hole stopped", error);
            }
            void renderer.setAnimationLoop(null);
        }
    }

    return {
        setState() {
            remeasureUntil = performance.now() + 1500;
            stillFrames = 2;
            measure();
        },
        setTheme,
        sing,
        pulse(amount: number) {
            kickAt = performance.now();
            kickAmount = amount;
        },
        run() {
            last = performance.now();
            void renderer.setAnimationLoop(tick);
        },
        pause() {
            void renderer.setAnimationLoop(null);
        },
        dispose() {
            listeners.abort();
            clearTimeout(resizeTimer);
            void renderer.setAnimationLoop(null);
            scene.traverse((object) => {
                if (object instanceof Mesh) object.geometry.dispose();
            });
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
            scenePass.dispose();
            pipeline.dispose();
            renderer.dispose();
            renderer.domElement.remove();
            grain.dispose();
        },
    };
}

/** The black hole behind the studio and Black Atom pages, receded on the quieter ones. */
export function createBlackHole(look: Look = tunedLook): BackgroundRenderer {
    const events = createEmitter();
    let scene: Awaited<ReturnType<typeof createScene>> | undefined;
    let theme: SceneTheme | undefined;
    let isDisposed = false;
    let isPaused = false;

    return {
        events,
        async start(host, { isStill }: RendererOptions) {
            const created = await createScene(host, look, isStill, (event) => events.emit(event));
            if (isDisposed) {
                created.dispose();
                return;
            }
            scene = created;
            if (theme) scene.setTheme(theme);
            if (!isPaused) scene.run();
        },
        setState() {
            scene?.setState();
        },
        sing(note) {
            scene?.sing(note);
        },
        pulse(amount) {
            scene?.pulse(amount);
        },
        setTheme(next) {
            theme = next;
            scene?.setTheme(next);
        },
        pause() {
            isPaused = true;
            scene?.pause();
        },
        resume() {
            if (!isPaused) return;
            isPaused = false;
            scene?.run();
        },
        dispose() {
            isDisposed = true;
            scene?.dispose();
        },
    };
}
