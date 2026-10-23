import { rng } from "#/background/rng.ts";
import {
    createScene2dRenderer,
    TAU,
    type Colors2d,
    type Frame,
    type Scene2d,
} from "#/background/scene-2d.ts";
import type { BackgroundRenderer } from "#/background/types.ts";

/** radar.nvim's direct keys: home-row locks, numbered recents, and `o` for the alternate file. */
const keys = ["a", "s", "d", "f", "g", "1", "2", "3", "4", "5", "o"] as const;

type BlipKind = "lock" | "recent" | "alternate" | "file";

interface Blip {
    angle: number;
    radius: number;
    key?: string;
    kind: BlipKind;
}

function kindOf(key: string | undefined): BlipKind {
    if (key === undefined) return "file";
    if (key === "o") return "alternate";
    return /[0-9]/.test(key) ? "recent" : "lock";
}

function blipColor(kind: BlipKind, colors: Colors2d): string {
    const byKind: Record<BlipKind, string> = {
        lock: colors.accent,
        recent: colors.palette[3],
        alternate: colors.palette[5],
        file: colors.sub,
    };
    return byKind[kind];
}

/** A sweep over the working set; locks and recents light up as the beam passes. */
function radarScene(context: CanvasRenderingContext2D): Scene2d {
    let blips: Blip[] = [];
    let center: Frame = { x: 0, y: 0, r: 0 };

    return {
        build(_viewport, frame) {
            const random = rng(11);
            center = { ...frame, r: frame.r * 1.25 };
            blips = Array.from({ length: 70 }, (_, i) => {
                const key: string | undefined = keys[i];
                const radius = key
                    ? center.r * (key === "o" ? 0.28 : 0.45 + random() * 0.95)
                    : center.r * (0.2 + random() * 2.6);
                return { angle: random() * TAU, radius, key, kind: kindOf(key) };
            });
        },
        draw(t, { width, height }, colors) {
            const c = center;
            const sweep = (t * 0.55) % TAU;
            const reach = Math.hypot(width, height);
            context.globalCompositeOperation = "source-over";
            context.strokeStyle = colors.sub;
            context.lineWidth = 1;
            for (let k = 1; k <= 7; k++) {
                context.globalAlpha = 0.2 - k * 0.018;
                context.beginPath();
                context.arc(c.x, c.y, c.r * 0.45 * k, 0, TAU);
                context.stroke();
            }
            context.globalAlpha = 0.08;
            context.beginPath();
            context.moveTo(c.x - width, c.y);
            context.lineTo(c.x + width, c.y);
            context.moveTo(c.x, c.y - height);
            context.lineTo(c.x, c.y + height);
            context.stroke();
            context.globalAlpha = 0.25;
            for (let m = 0; m < 72; m++) {
                const angle = (m / 72) * TAU;
                const r0 = c.r * 1.8;
                const r1 = r0 + (m % 6 === 0 ? 14 : 6);
                context.beginPath();
                context.moveTo(c.x + r0 * Math.cos(angle), c.y + r0 * Math.sin(angle));
                context.lineTo(c.x + r1 * Math.cos(angle), c.y + r1 * Math.sin(angle));
                context.stroke();
            }

            const beam = context.createConicGradient(sweep - 1.1, c.x, c.y);
            beam.addColorStop(0, "rgba(0,0,0,0)");
            beam.addColorStop(0.175, colors.accent);
            beam.addColorStop(0.176, "rgba(0,0,0,0)");
            beam.addColorStop(1, "rgba(0,0,0,0)");
            context.globalAlpha = colors.isLight ? 0.16 : 0.22;
            context.fillStyle = beam;
            context.beginPath();
            context.moveTo(c.x, c.y);
            context.arc(c.x, c.y, reach, sweep - 1.1, sweep);
            context.closePath();
            context.fill();

            context.globalAlpha = 0.9;
            context.strokeStyle = colors.accent;
            context.lineWidth = 1.5;
            context.shadowColor = colors.accent;
            context.shadowBlur = colors.isLight ? 0 : 12;
            context.beginPath();
            context.moveTo(c.x, c.y);
            context.lineTo(c.x + reach * Math.cos(sweep), c.y + reach * Math.sin(sweep));
            context.stroke();
            context.shadowBlur = 0;

            context.font = "600 13px 'Kode Mono', monospace";
            context.textAlign = "center";
            context.textBaseline = "middle";
            blips.forEach((blip) => {
                const since = (sweep - blip.angle + TAU) % TAU;
                const glow = Math.exp(-since * 1.1);
                const x = c.x + blip.radius * Math.cos(blip.angle);
                const y = c.y + blip.radius * Math.sin(blip.angle);
                const color = blipColor(blip.kind, colors);
                context.globalCompositeOperation = colors.isLight ? "source-over" : "lighter";
                if (blip.key) {
                    context.globalAlpha = 0.35 + 0.65 * glow;
                    context.strokeStyle = color;
                    context.lineWidth = 1.4;
                    context.shadowColor = color;
                    context.shadowBlur = colors.isLight ? 0 : 14 * glow;
                    context.beginPath();
                    context.arc(x, y, 15, 0, TAU);
                    context.stroke();
                    context.shadowBlur = 0;
                    context.fillStyle = color;
                    context.fillText(blip.key, x, y + 1);
                    if (glow > 0.05) {
                        context.globalAlpha = 0.4 * glow;
                        context.beginPath();
                        context.arc(x, y, 15 + (1 - glow) * 40, 0, TAU);
                        context.stroke();
                    }
                } else {
                    context.globalAlpha = 0.12 + 0.6 * glow;
                    context.fillStyle = color;
                    context.beginPath();
                    context.arc(x, y, 1.6 + glow * 1.4, 0, TAU);
                    context.fill();
                }
            });
            context.globalCompositeOperation = "source-over";
        },
    };
}

export function createRadarScene(): BackgroundRenderer {
    return createScene2dRenderer(radarScene);
}
