import {
    CustomBlending,
    OneFactor,
    OneMinusSrcAlphaFactor,
    type MeshBasicNodeMaterial,
    type Node,
} from "three/webgpu";
import { abs, clamp, float, floor, mix, select, smoothstep } from "three/tsl";
import type { SpaceUniforms } from "./landmark.ts";

/** Share of hues (0..1) coloured by the theme accents; the rest take the palette. */
export const ACCENT_SHARE = 0.58;

/**
 * Premultiplied output: alpha 0 adds light on dark themes, alpha `a` blends normally on light ones.
 * `fade` scales the result after the light-theme alpha saturates, so it thins lines on both.
 */
export function glowOutput(
    material: MeshBasicNodeMaterial,
    colorNode: Node<"vec3">,
    intensity: Node<"float">,
    light: Node<"float">,
    lift = 2.2,
    fade: Node<"float"> = float(1),
) {
    const alpha = clamp(intensity.mul(lift), 0, 1);
    material.colorNode = mix(colorNode.mul(intensity), colorNode.mul(alpha), light).mul(fade);
    material.opacityNode = alpha.mul(light).mul(fade);
    material.transparent = true;
    material.depthWrite = false;
    material.blending = CustomBlending;
    material.blendSrc = OneFactor;
    material.blendDst = OneMinusSrcAlphaFactor;
    material.blendSrcAlpha = OneFactor;
    material.blendDstAlpha = OneMinusSrcAlphaFactor;
}

/** The theme colour for hue `h`: an accent below `ACCENT_SHARE`, a palette colour above. */
export function hueColor(h: Node<"float">, S: SpaceUniforms): Node<"vec3"> {
    const accNodes = S.acc.map((u) => u.rgb);
    const palNodes = S.pal.map((u) => u.rgb);
    const ai = floor(h.div(ACCENT_SHARE).mul(S.nAcc));
    const pi = floor(
        h
            .sub(ACCENT_SHARE)
            .div(1 - ACCENT_SHARE)
            .mul(palNodes.length),
    );
    let accC: Node<"vec3"> = accNodes[3];
    for (let k = 2; k >= 0; k--) accC = select(ai.lessThan(k + 0.5), accNodes[k], accC);
    let palC: Node<"vec3"> = palNodes[palNodes.length - 1];
    for (let k = palNodes.length - 2; k >= 0; k--) {
        palC = select(pi.lessThan(k + 0.5), palNodes[k], palC);
    }
    return select(h.lessThan(ACCENT_SHARE), accC, palC);
}

/** Blends the accents around a ring by phase `ph` (0..nAcc). */
export function accentAt(ph: Node<"float">, S: SpaceUniforms): Node<"vec3"> {
    const accNodes = S.acc.map((u) => u.rgb);
    const seg = (k: number) =>
        smoothstep(
            float(0.62),
            float(0.38),
            abs(ph.sub(k))
                .min(abs(ph.sub(k).sub(S.nAcc)))
                .min(abs(ph.sub(k).add(S.nAcc))),
        );
    let mixed: Node<"vec3"> = accNodes[0].mul(seg(0));
    let weight: Node<"float"> = seg(0);
    for (let k = 1; k < 4; k++) {
        const wk = seg(k).mul(select(S.nAcc.greaterThan(k - 0.5), float(1), float(0)));
        mixed = mixed.add(accNodes[k].mul(wk));
        weight = weight.add(wk);
    }
    return mixed.div(weight.add(1e-4));
}
